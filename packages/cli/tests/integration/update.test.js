// Tests de `baretta update`: genera proyectos reales, los desactualiza a mano y comprueba que
// computeUpdate() detecta y corrige SOLO lo que gestiona el perfil, dejando intacto el resto.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { plan, writeProject } from '../../src/core/generator/index.js';
import { computeUpdate, applyUpdate } from '../../src/cli/commands/update.js';

const make = (over = {}) => ({
  name: 'demo-app',
  framework: 'nextjs',
  backend: 'postgres',
  auth: 'clerk',
  authMethod: 'google',
  payments: { enabled: false, provider: null, type: null },
  extras: ['biome'],
  packageManager: 'pnpm',
  install: 'skip',
  ...over,
});

async function generate(cfg) {
  const dir = mkdtempSync(join(tmpdir(), 'baretta-update-'));
  const app = join(dir, 'app');
  writeProject(await plan(cfg), app);
  return { app, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const readPkg = (app) => JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
const writePkg = (app, pkg) => writeFileSync(join(app, 'package.json'), JSON.stringify(pkg, null, 2));

test('update: un proyecto recién generado ya está al día (sin cambios)', async () => {
  const { app, cleanup } = await generate(make());
  try {
    const r = await computeUpdate(app);
    assert.equal(r.status, 'ok');
    assert.equal(r.hasChanges, false, JSON.stringify({ bumps: r.bumps, adds: r.adds, node: r.nodeChange }));
  } finally {
    cleanup();
  }
});

test('update: detecta versión vieja y Node desactualizado; preserva deps agregadas a mano', async () => {
  const { app, cleanup } = await generate(make());
  try {
    const pkg = readPkg(app);
    pkg.dependencies.next = '15.0.0';
    pkg.dependencies['mi-lib-interna'] = '^1.2.3';
    pkg.engines.node = '>=20.0.0';
    writePkg(app, pkg);

    const r = await computeUpdate(app);
    assert.equal(r.status, 'ok');
    assert.ok(r.hasChanges);
    const next = r.bumps.find((b) => b.name === 'next');
    assert.ok(next && next.from === '15.0.0' && /^16\./.test(next.to), 'bump de next');
    assert.ok(r.nodeChange && r.nodeChange.to === '>=22.12.0');
    assert.ok(r.unmanaged.includes('mi-lib-interna'), 'la dep manual se reporta como no gestionada');
    // El package.json nuevo mantiene la dep manual y actualiza next.
    assert.equal(r.newPkg.dependencies['mi-lib-interna'], '^1.2.3');
    assert.match(r.newPkg.dependencies.next, /^16\./);
  } finally {
    cleanup();
  }
});

test('update: applyUpdate escribe y deja el proyecto al día (idempotente)', async () => {
  const { app, cleanup } = await generate(make());
  try {
    const pkg = readPkg(app);
    pkg.devDependencies.typescript = '5.0.0';
    writePkg(app, pkg);

    const first = await computeUpdate(app);
    assert.ok(first.bumps.some((b) => b.name === 'typescript'));
    applyUpdate(first);

    // En disco quedó la versión del perfil.
    assert.notEqual(readPkg(app).devDependencies.typescript, '5.0.0');
    // Y un segundo cálculo no encuentra nada que cambiar.
    const second = await computeUpdate(app);
    assert.equal(second.hasChanges, false);
  } finally {
    cleanup();
  }
});

test('update: agrega una dependencia gestionada que falte', async () => {
  const { app, cleanup } = await generate(make());
  try {
    const pkg = readPkg(app);
    delete pkg.dependencies.next; // el perfil la espera: update debe volver a agregarla
    writePkg(app, pkg);

    const r = await computeUpdate(app);
    assert.ok(r.adds.some((a) => a.name === 'next'), 'next se marca como adición');
    assert.ok(r.newPkg.dependencies.next, 'next vuelve al package.json');
  } finally {
    cleanup();
  }
});

test('update: carpeta sin baretta.config.json es inválida', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'baretta-update-'));
  try {
    const r = await computeUpdate(dir);
    assert.equal(r.status, 'invalid');
    assert.match(r.reason, /baretta\.config\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
