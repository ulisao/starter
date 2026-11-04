// Tests de `baretta doctor`: genera proyectos reales en disco y los diagnostica con diagnose(),
// sin instalar dependencias. Cubre el caso sano, la detección de desvíos (versión cambiada a mano,
// dependencia extra, variables de entorno faltantes) y las entradas inválidas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { plan, writeProject } from '../../src/core/generator/index.js';
import { diagnose } from '../../src/cli/commands/doctor.js';

const make = (over = {}) => ({
  name: 'demo-app',
  framework: 'nextjs',
  backend: 'postgres',
  auth: 'better-auth',
  authMethod: 'password',
  payments: { enabled: false, provider: null, type: null },
  extras: [],
  packageManager: 'npm',
  install: 'skip',
  ...over,
});

// Genera un proyecto en una carpeta temporal y devuelve su ruta y una función de limpieza.
async function generate(cfg) {
  const dir = mkdtempSync(join(tmpdir(), 'baretta-doctor-'));
  const app = join(dir, 'app');
  writeProject(await plan(cfg), app);
  return { app, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const levels = (r) => r.report.map((l) => l.level);
const text = (r) => r.report.map((l) => `${l.level} ${l.msg}`).join('\n');

test('doctor: proyecto recién generado está sano (solo advierte node_modules y .env.local)', async () => {
  const { app, cleanup } = await generate(make());
  try {
    const r = await diagnose(app);
    assert.equal(r.status, 'ok');
    assert.equal(r.errors, 0, text(r));
    assert.ok(!levels(r).includes('ERROR'));
    // Sin instalar ni crear .env.local, esas dos cosas son advertencias esperadas.
    assert.match(text(r), /node_modules/);
    assert.match(text(r), /\.env\.local/);
    // Las dependencias del perfil deben coincidir (no se tocó package.json).
    assert.match(text(r), /dependencias coinciden con el perfil/);
  } finally {
    cleanup();
  }
});

test('doctor: detecta versión cambiada a mano y dependencia agregada', async () => {
  const { app, cleanup } = await generate(make());
  try {
    const pkgPath = join(app, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkg.dependencies.next = '99.0.0';
    pkg.dependencies['paquete-pirata'] = '1.0.0';
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    const r = await diagnose(app);
    assert.equal(r.status, 'ok'); // son advertencias, no errores
    assert.match(text(r), /next: el proyecto fija 99\.0\.0/);
    assert.match(text(r), /paquete-pirata/);
    assert.ok(r.warns >= 2);
  } finally {
    cleanup();
  }
});

test('doctor: detecta dependencia faltante como ERROR', async () => {
  const { app, cleanup } = await generate(make());
  try {
    const pkgPath = join(app, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    delete pkg.dependencies.next; // quita una dependencia que el perfil espera
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    const r = await diagnose(app);
    assert.ok(r.errors >= 1);
    assert.match(text(r), /falta la dependencia next/);
  } finally {
    cleanup();
  }
});

test('doctor: variables de entorno faltantes y secretos vacíos', async () => {
  // Con pagos hay un secreto de webhook sin valor de ejemplo: al copiar .env.example queda vacío.
  const { app, cleanup } = await generate(make({ payments: { enabled: true, provider: 'mercadopago', type: 'one-time' } }));
  try {
    writeFileSync(join(app, '.env.local'), readFileSync(join(app, '.env.example'), 'utf8'));
    const r = await diagnose(app);
    // Ya no advierte que falta el archivo, pero sí que hay secretos sin valor.
    assert.ok(!text(r).includes('no existe .env.local'));
    assert.match(text(r), /sin valor en \.env\.local/);
    assert.match(text(r), /MERCADOPAGO_WEBHOOK_SECRET/);
  } finally {
    cleanup();
  }
});

test('doctor: carpeta sin baretta.config.json es inválida', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'baretta-doctor-'));
  try {
    const r = await diagnose(dir);
    assert.equal(r.status, 'invalid');
    assert.match(r.reason, /baretta\.config\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
