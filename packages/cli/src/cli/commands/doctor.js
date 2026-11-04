// `baretta doctor [carpeta]`: diagnostica un proyecto YA generado comparándolo con el registro de
// compatibilidad. No instala nada ni toca la red: solo lee archivos. Reconstruye la configuración
// desde `baretta.config.json`, vuelve a planificar el proyecto con el mismo perfil y contrasta lo
// esperado contra lo que hay en disco: versiones del package.json, Node, variables de entorno y
// estado de compatibilidad. Sale con código 1 si encuentra algún problema (ERROR).

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { plan } from '../../core/generator/index.js';
import { loadProfile } from '../../core/compatibility/index.js';

export const DOCTOR_HELP = `
Uso: baretta doctor [carpeta]

Revisa un proyecto generado (por defecto la carpeta actual) contra el registro de
compatibilidad: versiones de dependencias, Node, variables de entorno y estado.
No instala nada ni accede a la red. Devuelve código 1 si hay errores.
`;

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Comparación mínima de ">=X.Y.Z" (único formato que usa el perfil) contra la versión de Node actual.
function nodeSatisfies(range, version) {
  const m = /^>=\s*(\d+)\.(\d+)\.(\d+)/.exec(range);
  if (!m) return true; // formato no reconocido: no bloquea
  const need = m.slice(1, 4).map(Number);
  const have = version.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((have[i] ?? 0) > need[i]) return true;
    if ((have[i] ?? 0) < need[i]) return false;
  }
  return true;
}

// Lee las claves definidas en un archivo .env (ignora comentarios y líneas en blanco).
function envKeys(path) {
  const keys = new Map();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) keys.set(t.slice(0, eq).trim(), t.slice(eq + 1).trim());
  }
  return keys;
}

export async function doctorCommand(argv) {
  const dir = resolve(argv[0] ?? '.');
  const report = [];
  let errors = 0;
  let warns = 0;
  const ok = (m) => report.push(`  OK    ${m}`);
  const warn = (m) => {
    warns++;
    report.push(`  WARN  ${m}`);
  };
  const err = (m) => {
    errors++;
    report.push(`  ERROR ${m}`);
  };

  const configPath = join(dir, 'baretta.config.json');
  if (!existsSync(configPath)) {
    console.error(`No se encontró baretta.config.json en ${dir}. ¿Es un proyecto generado con baretta?`);
    process.exitCode = 1;
    return;
  }
  const config = readJson(configPath);
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error(`No se encontró package.json en ${dir}.`);
    process.exitCode = 1;
    return;
  }
  const pkg = readJson(pkgPath);

  console.log(`Diagnóstico de ${pkg.name ?? dir}`);
  console.log(`Config: backend=${config.backend}, auth=${config.auth}${config.authMethod ? `/${config.authMethod}` : ''}, pagos=${config.payments?.enabled ? config.payments.type : 'no'}, perfil=${config.compatibilityProfile}\n`);

  // Reconstruye la configuración y vuelve a planificar con el mismo perfil.
  const cfg = {
    name: pkg.name,
    framework: config.framework ?? 'nextjs',
    backend: config.backend,
    auth: config.auth,
    authMethod: config.authMethod ?? null,
    payments: config.payments ?? { enabled: false, provider: null, type: null },
    extras: config.extras ?? [],
    packageManager: config.packageManager ?? 'npm',
    install: 'skip',
  };

  let expected;
  let profile;
  try {
    profile = loadProfile(config.compatibilityProfile ?? 'stable');
    expected = await plan(cfg, { profileName: config.compatibilityProfile ?? 'stable' });
  } catch (e) {
    console.error(`No se pudo reconstruir el proyecto desde baretta.config.json: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // ── Node ────────────────────────────────────────────────────────────────────
  if (nodeSatisfies(profile.node, process.version)) ok(`Node ${process.version} cumple ${profile.node}`);
  else err(`Node ${process.version} no cumple ${profile.node} (actualizá Node).`);

  // ── Dependencias: versiones esperadas vs las del package.json ────────────────
  const expDeps = { ...expected.packageJson.dependencies, ...expected.packageJson.devDependencies };
  const actDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  let depIssues = 0;
  for (const [name, version] of Object.entries(expDeps)) {
    if (!(name in actDeps)) {
      err(`falta la dependencia ${name}@${version} que el perfil espera.`);
      depIssues++;
    } else if (actDeps[name] !== version) {
      warn(`${name}: el proyecto fija ${actDeps[name]} pero el perfil espera ${version} (¿cambio manual?).`);
      depIssues++;
    }
  }
  const extra = Object.keys(actDeps).filter((n) => !(n in expDeps));
  if (extra.length) warn(`dependencias que el perfil no aporta (agregadas a mano): ${extra.join(', ')}.`);
  if (!depIssues) ok(`${Object.keys(expDeps).length} dependencias coinciden con el perfil`);

  // ── node_modules instalado (pista, no obligatorio) ───────────────────────────
  if (!existsSync(join(dir, 'node_modules'))) warn(`no hay node_modules: ejecutá la instalación antes de arrancar.`);

  // ── Variables de entorno ─────────────────────────────────────────────────────
  const localPath = join(dir, '.env.local');
  if (!existsSync(localPath)) {
    warn(`no existe .env.local: copiá .env.example y completá los valores.`);
  } else {
    const local = envKeys(localPath);
    const missing = [];
    const empty = [];
    for (const e of expected.env) {
      if (!local.has(e.key)) missing.push(e);
      else if (!local.get(e.key)) empty.push(e);
    }
    const describe = (list) => list.map((e) => e.key + (e.secret ? ' 🔒' : '')).join(', ');
    if (missing.length) warn(`faltan variables en .env.local: ${describe(missing)}.`);
    if (empty.length) warn(`variables sin valor en .env.local: ${describe(empty)}.`);
    if (!missing.length && !empty.length) ok(`las ${expected.env.length} variables de entorno están definidas`);
  }

  // ── Estado de compatibilidad ─────────────────────────────────────────────────
  if (expected.status !== config.compatibilityStatus) {
    warn(`estado de compatibilidad: el proyecto se generó como "${config.compatibilityStatus}" y hoy el registro dice "${expected.status}".`);
  } else {
    ok(`estado de compatibilidad: ${expected.status}`);
  }
  if (expected.status === 'experimental') warn(`esta combinación es experimental: revisá docs/COMPATIBILITY.md antes de producción.`);

  // ── Resumen ──────────────────────────────────────────────────────────────────
  console.log(report.join('\n'));
  console.log(`\n${errors ? `${errors} error(es), ` : ''}${warns} advertencia(s). ${errors ? 'Revisá los ERROR.' : 'Sin errores.'}`);
  if (errors) process.exitCode = 1;
}
