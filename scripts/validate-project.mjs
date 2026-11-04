#!/usr/bin/env node
// Validación REAL de una combinación: genera un proyecto, instala dependencias y ejecuta
// typecheck, lint (si existe), tests (si existen) y build de producción.
//
// Es la única forma de marcar una combinación como `verified` en compatibility/.
//
// Uso:
//   node scripts/validate-project.mjs --name pg-none --backend postgres --auth none \
//        [--auth-method password] [--payments none|one-time|subscription] \
//        [--extras biome,vitest] [--pm npm] [--env KEY=valor ...] [--workdir C:/Users/PC/bs-work] [--keep] [--record]
//
// `--env` define variables de entorno SOLO para el build (valores falsos pero con formato válido,
// por ejemplo una publishable key de prueba) porque algunos SDK validan el formato al compilar.
//
// Salida: una línea por paso (PASS/FAIL) y código de salida distinto de 0 si algo falla.
// Los logs completos quedan en <workdir>/<name>.log

import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { plan, writeProject } from '../packages/cli/src/core/generator/index.js';

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    backend: { type: 'string' },
    auth: { type: 'string', default: 'none' },
    'auth-method': { type: 'string' },
    payments: { type: 'string', default: 'none' },
    extras: { type: 'string', default: '' },
    pm: { type: 'string', default: 'npm' },
    env: { type: 'string', multiple: true, default: [] },
    workdir: { type: 'string', default: 'C:/Users/PC/bs-work' },
    keep: { type: 'boolean', default: false },
    record: { type: 'boolean', default: false },
    'skip-install': { type: 'boolean', default: false },
    'generate-only': { type: 'boolean', default: false },
  },
});

const pay = values.payments;
const cfg = {
  name: values.name,
  backend: values.backend,
  auth: values.auth,
  authMethod: values.auth === 'none' ? null : (values['auth-method'] ?? 'password'),
  payments: pay === 'none' ? { enabled: false, provider: null, type: null } : { enabled: true, provider: 'mercadopago', type: pay },
  extras: values.extras ? values.extras.split(',') : [],
  packageManager: values.pm,
  install: 'skip',
};

const dir = resolve(values.workdir, cfg.name);
const log = join(resolve(values.workdir), `${cfg.name}.log`);
mkdirSync(resolve(values.workdir), { recursive: true });
writeFileSync(log, '');
rmSync(dir, { recursive: true, force: true });

const result = await plan(cfg);
writeProject(result, dir);
console.log(`Generado ${cfg.name}: ${result.files.size} archivos, estado de compatibilidad: ${result.status}`);

// Chequeo de humo: ninguna plantilla debe quedar con marcadores sin resolver.
const unresolved = [...result.files].filter(([, c]) => typeof c === 'string' && (c.includes('<%#') || c.includes('<%=')));
if (unresolved.length) {
  console.log(`FAIL  generación  marcadores sin resolver en: ${unresolved.map(([p]) => p).join(', ')}`);
  process.exit(1);
}

// --generate-only: valida solo que el proyecto se genera limpio (sin install/build). Humo rápido.
if (values['generate-only']) {
  console.log('PASS  generación (sin marcadores sin resolver)');
  if (!values.keep) rmSync(dir, { recursive: true, force: true });
  process.exit(0);
}

const extraEnv = Object.fromEntries(values.env.map((kv) => [kv.slice(0, kv.indexOf('=')), kv.slice(kv.indexOf('=') + 1)]));
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
const run = { npm: 'npm run', pnpm: 'pnpm', yarn: 'yarn', bun: 'bun run' }[cfg.packageManager];

const steps = [];
if (!values['skip-install']) steps.push(['install', `${cfg.packageManager} install`]);
steps.push(['typecheck', `${run} typecheck`]);
// Igual que el CLI tras instalar: Biome formatea una vez el código generado antes de revisarlo.
if (pkg.scripts['lint:fix']) steps.push(['lint:fix', `${run} lint:fix`]);
for (const s of ['lint', 'test']) if (pkg.scripts[s]) steps.push([s, `${run} ${s}`]);
steps.push(['build', `${run} build`]);

let failed = false;
for (const [label, cmd] of steps) {
  const t = Date.now();
  const r = spawnSync(cmd, { cwd: dir, shell: true, encoding: 'utf8', env: { ...process.env, ...extraEnv, CI: '1' }, maxBuffer: 64 * 1024 * 1024 });
  appendFileSync(log, `\n===== ${label}: ${cmd} (exit ${r.status}) =====\n${r.stdout ?? ''}\n${r.stderr ?? ''}\n`);
  const ok = r.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(10)} ${((Date.now() - t) / 1000).toFixed(1)}s`);
  if (!ok) {
    failed = true;
    console.log(`      → ${cmd}\n${(r.stdout + r.stderr).trim().split('\n').slice(-25).join('\n')}`);
    break;
  }
}
console.log(`Log completo: ${log}`);

// --record: deja constancia en el registro de compatibilidad SOLO si todo pasó.
//  - combinación backend+auth → verified (salvo las marcadas experimental, que conservan su estado)
//  - cada paquete del proyecto generado → verified con la fecha de hoy
if (values.record && !failed) {
  const today = new Date().toISOString().slice(0, 10);
  const compat = join(import.meta.dirname, '../packages/cli/compatibility');
  const comboFile = join(compat, 'combinations', `next-${cfg.backend}-${cfg.auth}.json`);
  const combo = JSON.parse(readFileSync(comboFile, 'utf8'));
  if (combo.status !== 'experimental') combo.status = 'verified';
  combo.verifiedAt = today;
  writeFileSync(comboFile, JSON.stringify(combo, null, 2) + '\n');
  for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    const f = join(compat, 'profiles/stable/packages', `${name.replace('@', '').replace('/', '-')}.json`);
    const entry = JSON.parse(readFileSync(f, 'utf8'));
    if (entry.status === 'experimental') continue;
    entry.status = 'verified';
    entry.verifiedAt = today;
    writeFileSync(f, JSON.stringify(entry, null, 2) + '\n');
  }
  console.log('Registro de compatibilidad actualizado (--record).');
}
if (!values.keep && !failed) rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
