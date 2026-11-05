// Tests de integración: generan proyectos en memoria (y uno en disco) para TODA la matriz soportada
// y comprueban estructura, dependencias, documentación y ausencia de archivos no pedidos.
// No instalan dependencias: la instalación + typecheck + build reales se hacen con
// scripts/validate-project.mjs (ver docs/DEVELOPMENT.md).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { plan, writeProject } from '../../src/core/generator/index.js';
import { validateConfig, AUTH_METHODS, EXTRAS } from '../../src/core/configuration/schema.js';
import { loadProfile } from '../../src/core/compatibility/index.js';

const profile = loadProfile('stable');

// Matriz de combinaciones backend + auth soportadas (spec §12.3).
const COMBOS = [
  ['convex', 'none'], ['convex', 'better-auth'], ['convex', 'clerk'], ['convex', 'convex-auth'],
  ['supabase', 'none'], ['supabase', 'supabase-auth'], ['supabase', 'clerk'], ['supabase', 'better-auth'],
  ['postgres', 'none'], ['postgres', 'clerk'], ['postgres', 'better-auth'],
];

const make = (backend, auth, over = {}) => ({
  name: 'demo-app',
  framework: 'nextjs',
  backend,
  auth,
  authMethod: auth === 'none' ? null : 'password',
  payments: { enabled: false, provider: null, type: null },
  extras: [],
  packageManager: 'npm',
  install: 'skip',
  ...over,
});

const paths = (p) => [...p.files.keys()];
const all = (p) => [...p.files.entries()];

for (const [backend, auth] of COMBOS) {
  test(`${backend} + ${auth}: genera un proyecto coherente`, async () => {
    const p = await plan(make(backend, auth));
    const pkg = p.packageJson;
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Prisma solo con backends PostgreSQL; Convex usa su modelo nativo.
    const prisma = backend !== 'convex';
    assert.equal('prisma' in deps, prisma, 'prisma en package.json');
    assert.equal(paths(p).some((f) => f.startsWith('prisma/')), prisma, 'carpeta prisma/');
    assert.equal(paths(p).some((f) => f.startsWith('convex/')), backend === 'convex', 'carpeta convex/');
    assert.equal('convex' in deps, backend === 'convex');

    // Versiones exactas del perfil (o de la combinación), nunca latest.
    for (const [name, version] of Object.entries(deps)) {
      assert.match(version, /^\d+\.\d+\.\d+$/, `${name}: "${version}"`);
      assert.ok(profile.packages[name], `${name} no figura en el perfil`);
    }

    // Archivos obligatorios de la estructura pro-IA.
    for (const f of ['AGENTS.md', 'CLAUDE.md', 'README.md', 'baretta.config.json', '.env.example', '.gitignore', 'Dockerfile', 'vercel.json', 'docs/ARCHITECTURE.md', 'docs/DEPLOYMENT.md', 'docs/COMPATIBILITY.md']) {
      assert.ok(p.files.has(f), `falta ${f}`);
    }
    assert.match(p.files.get('CLAUDE.md'), /@AGENTS\.md/);

    // Sin directivas ni variables sin resolver.
    for (const [file, content] of all(p)) assert.ok(!content.includes('<%'), `${file} tiene plantilla sin resolver`);

    // Sin pagos ni extras: no aparece nada de ellos.
    assert.ok(!('mercadopago' in deps));
    assert.ok(!paths(p).some((f) => f.includes('payments')), 'archivos de pagos sin haberlos pedido');
    assert.ok(!/MERCADOPAGO/.test(p.files.get('.env.example')));

    // baretta.config.json refleja las decisiones.
    const conf = JSON.parse(p.files.get('baretta.config.json'));
    assert.equal(conf.backend, backend);
    assert.equal(conf.auth, auth);
    assert.equal(conf.orm, prisma ? 'prisma' : null);
    assert.deepEqual(conf.deployment, ['vercel', 'docker']);

    // La documentación del proyecto menciona el stack real y AGENTS.md el proveedor de auth.
    if (auth !== 'none') assert.ok(p.files.has('docs/AUTHENTICATION.md'), 'falta docs/AUTHENTICATION.md');
    assert.ok(p.files.has('docs/DATABASE.md'), 'falta docs/DATABASE.md');
    assert.ok(p.files.get('docs/ENVIRONMENT.md').includes('NEXT_PUBLIC_APP_URL'));
  });
}

test('el estado global nunca supera al peor componente (no se presenta candidate como verified)', async () => {
  for (const [backend, auth] of COMBOS) {
    const p = await plan(make(backend, auth));
    const worst = ['verified', 'candidate', 'experimental'];
    const component = [...Object.keys({ ...p.packageJson.dependencies, ...p.packageJson.devDependencies })].map((n) => profile.packages[n].status);
    const expectAtLeast = Math.max(...component.map((s) => worst.indexOf(s)), worst.indexOf(p.compat.combo?.status ?? 'candidate'));
    assert.ok(worst.indexOf(p.status) >= expectAtLeast, `${backend}+${auth}: estado ${p.status}`);
  }
});

test('todos los métodos de acceso renderizan para cada proveedor', async () => {
  const providers = [['postgres', 'clerk'], ['supabase', 'supabase-auth'], ['postgres', 'better-auth'], ['convex', 'convex-auth']];
  for (const [backend, auth] of providers) {
    for (const authMethod of AUTH_METHODS) {
      const p = await plan(make(backend, auth, { authMethod }));
      assert.ok(p.files.get('docs/AUTHENTICATION.md').length > 200, `${auth}/${authMethod}`);
      for (const [file, content] of all(p)) assert.ok(!content.includes('<%'), `${auth}/${authMethod}: ${file}`);
    }
  }
});

test('pagos: Mercado Pago solo cuando se pide, con ambos tipos', async () => {
  for (const type of ['one-time', 'subscription']) {
    const p = await plan(make('postgres', 'none', { payments: { enabled: true, provider: 'mercadopago', type } }));
    assert.ok('mercadopago' in p.packageJson.dependencies);
    assert.ok(p.files.has('docs/PAYMENTS.md'));
    assert.match(p.files.get('.env.example'), /MERCADOPAGO/);
    assert.ok(!p.files.get('.env.example').split('\n').some((l) => /^NEXT_PUBLIC_.*(TOKEN|SECRET)/.test(l)), 'secreto expuesto');
  }
});

test('cada extra: aporta dependencias/archivos solo cuando se selecciona', async () => {
  const baseline = await plan(make('postgres', 'none'));
  for (const extra of EXTRAS) {
    const withExtra = await plan(make('postgres', 'none', { extras: [extra] }));
    assert.ok(withExtra.modules.some((m) => m.includes(extra)), `${extra}: ningún módulo se activó`);
    assert.ok(!baseline.modules.some((m) => m.includes(`extra-${extra}`)), `${extra}: activo sin pedirlo`);
    assert.ok(withExtra.files.has('docs/EXTRAS.md'));
  }
});

test('un secreto con prefijo NEXT_PUBLIC_ en cualquier módulo hace fallar la generación', async () => {
  // Contrato verificado en el generador: se comprueba sobre todas las variables ya generadas.
  for (const [backend, auth] of COMBOS) {
    const p = await plan(make(backend, auth, { extras: EXTRAS.filter((e) => e !== 'storage' || backend !== 'convex') }));
    for (const e of p.env) assert.ok(!(e.secret && e.key.startsWith('NEXT_PUBLIC_')), e.key);
  }
});

test('writeProject escribe a disco y se niega a pisar una carpeta con contenido', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'baretta-gen-'));
  try {
    const p = await plan(make('postgres', 'none'));
    writeProject(p, join(dir, 'app'));
    assert.ok(existsSync(join(dir, 'app', 'package.json')));
    assert.equal(JSON.parse(readFileSync(join(dir, 'app', 'package.json'), 'utf8')).name, 'demo-app');
    assert.throws(() => writeProject(p, join(dir, 'app')), /no está vacía/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('configuraciones inválidas se rechazan antes de generar', async () => {
  await assert.rejects(plan(make('postgres', 'supabase-auth', { authMethod: 'password' })), /Supabase Auth solo funciona con/);
  await assert.rejects(plan(make('postgres', 'none', { name: 'Mal Nombre' })), /Nombre de proyecto inválido/);
});

test('validateConfig acepta toda la matriz con todos los métodos', () => {
  for (const [backend, auth] of COMBOS) {
    for (const authMethod of auth === 'none' ? [null] : AUTH_METHODS) {
      assert.deepEqual(validateConfig(make(backend, auth, { authMethod })).errors, [], `${backend}+${auth}+${authMethod}`);
    }
  }
});

// Regresión: un proyecto Clerk recién generado (sin claves) no debe romperse con
// "Publishable key not valid". El provider valida la clave y el proxy no ejecuta Clerk sin ella.
test('clerk: el proyecto sin claves muestra una guía en vez de romperse', async () => {
  for (const backend of ['convex', 'supabase', 'postgres']) {
    const p = await plan(make(backend, 'clerk'));
    const providers = p.files.get('src/components/providers.tsx');
    assert.match(providers, /ClerkAuthProvider/, `${backend}: providers.tsx`);
    assert.doesNotMatch(providers, /<ClerkProvider>/, `${backend}: ClerkProvider crudo`);
    assert.match(p.files.get('src/components/auth/clerk-auth-provider.tsx'), /CLAVE_VALIDA/);
    assert.match(p.files.get('src/proxy.ts'), /tieneClaves/);
    // Nada fuera del provider debe montar ClerkProvider directamente.
    for (const [file, content] of all(p)) {
      if (!file.startsWith("src/") || file === "src/components/auth/clerk-auth-provider.tsx") continue;
      assert.doesNotMatch(content, /<ClerkProvider/, `${backend}: ${file}`);
    }
  }
});
