// `baretta update [carpeta] [--profile <nombre>] [--dry-run] [--yes]`: reconcilia las VERSIONES de un
// proyecto generado con un perfil de compatibilidad. Es el complemento de `doctor`: doctor avisa,
// update corrige. Solo toca package.json (versiones de dependencias que gestiona el perfil + Node) y
// baretta.config.json (metadatos de compatibilidad). NUNCA toca el código ni los scripts del usuario,
// ni las dependencias que agregaste a mano. No instala nada: al final recuerda reinstalar.

import { parseArgs } from 'node:util';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as p from '@clack/prompts';
import { plan } from '../../core/generator/index.js';

export const UPDATE_HELP = `
Uso: baretta update [carpeta] [opciones]

Actualiza las versiones de dependencias de un proyecto generado para que coincidan con el
perfil de compatibilidad (no toca tu código ni las dependencias que agregaste a mano).

Opciones:
  --profile <nombre>   Perfil objetivo (por defecto el del proyecto)
  --dry-run            Solo muestra los cambios, no escribe nada
  -y, --yes            Aplica sin pedir confirmación
`;

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/**
 * Calcula los cambios de versión necesarios SIN escribir nada. Devuelve el resultado estructurado
 * (para la CLI y los tests). `status`: 'ok' | 'invalid'. Cuando es 'ok' incluye `bumps`, `adds`,
 * `nodeChange`, `statusChange`, `hasChanges`, y `newPkg`/`newConfig` ya listos para escribir.
 */
export async function computeUpdate(dir, { profileName } = {}) {
  const configPath = join(dir, 'baretta.config.json');
  if (!existsSync(configPath)) return { status: 'invalid', reason: `No se encontró baretta.config.json en ${dir}. ¿Es un proyecto generado con baretta?` };
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return { status: 'invalid', reason: `No se encontró package.json en ${dir}.` };

  const config = readJson(configPath);
  const pkg = readJson(pkgPath);
  const profile = profileName ?? config.compatibilityProfile ?? 'stable';

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
  try {
    expected = await plan(cfg, { profileName: profile });
  } catch (e) {
    return { status: 'invalid', reason: `No se pudo reconstruir el proyecto desde baretta.config.json: ${e.message}` };
  }

  // Secciones objetivo según el perfil. `managed` = deps que aporta el generador (las únicas que tocamos).
  const expDeps = expected.packageJson.dependencies;
  const expDevDeps = expected.packageJson.devDependencies;
  const managed = { ...expDeps, ...expDevDeps };

  // Clona para producir el package.json nuevo sin perder dependencias agregadas a mano ni scripts.
  const newPkg = { ...pkg, dependencies: { ...(pkg.dependencies ?? {}) }, devDependencies: { ...(pkg.devDependencies ?? {}) } };
  const bumps = [];
  const adds = [];
  // Ubica un paquete gestionado en la sección correcta, actualizando su versión.
  const place = (name, version, preferDev) => {
    const inDeps = name in newPkg.dependencies;
    const inDev = name in newPkg.devDependencies;
    const current = inDeps ? newPkg.dependencies[name] : inDev ? newPkg.devDependencies[name] : null;
    if (current === null) {
      adds.push({ name, to: version });
      (preferDev ? newPkg.devDependencies : newPkg.dependencies)[name] = version;
    } else if (current !== version) {
      bumps.push({ name, from: current, to: version });
      (inDev ? newPkg.devDependencies : newPkg.dependencies)[name] = version;
    }
  };
  for (const [name, version] of Object.entries(expDeps)) place(name, version, false);
  for (const [name, version] of Object.entries(expDevDeps)) place(name, version, true);

  // Reordena cada sección alfabéticamente, igual que el generador.
  const sortObj = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  newPkg.dependencies = sortObj(newPkg.dependencies);
  newPkg.devDependencies = sortObj(newPkg.devDependencies);

  // Node: lo fija el perfil (engines.node). Metadatos de compatibilidad: desde el baretta.config.json recién planificado.
  const nodeFrom = pkg.engines?.node ?? null;
  const nodeTo = expected.packageJson.engines.node;
  if (nodeTo !== nodeFrom) newPkg.engines = { ...(pkg.engines ?? {}), node: nodeTo };
  const nodeChange = nodeTo !== nodeFrom ? { from: nodeFrom, to: nodeTo } : null;

  const newConfig = JSON.parse(expected.files.get('baretta.config.json'));
  const statusChange = newConfig.compatibilityStatus !== config.compatibilityStatus ? { from: config.compatibilityStatus, to: newConfig.compatibilityStatus } : null;
  const profileChange = newConfig.compatibilityProfile !== config.compatibilityProfile ? { from: config.compatibilityProfile, to: newConfig.compatibilityProfile } : null;

  // Dependencias del proyecto que el perfil NO gestiona (agregadas a mano): se informan, no se tocan.
  const unmanaged = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => !(n in managed));

  const hasChanges = bumps.length > 0 || adds.length > 0 || !!nodeChange || !!statusChange || !!profileChange;
  return { status: 'ok', bumps, adds, nodeChange, statusChange, profileChange, unmanaged, hasChanges, newPkg, newConfig, pkgPath, configPath };
}

/** Escribe los cambios calculados en disco (package.json y baretta.config.json). */
export function applyUpdate(result) {
  writeFileSync(result.pkgPath, JSON.stringify(result.newPkg, null, 2) + '\n');
  writeFileSync(result.configPath, JSON.stringify(result.newConfig, null, 2) + '\n');
}

export async function updateCommand(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      profile: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      yes: { type: 'boolean', short: 'y', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) return console.log(UPDATE_HELP);

  const dir = resolve(positionals[0] ?? '.');
  const result = await computeUpdate(dir, { profileName: values.profile });
  if (result.status === 'invalid') {
    console.error(result.reason);
    process.exitCode = 1;
    return;
  }

  console.log(`Actualización de ${result.newConfig.backend} + ${result.newConfig.auth} (perfil ${result.newConfig.compatibilityProfile})\n`);
  if (!result.hasChanges) {
    console.log('El proyecto ya está al día con el perfil. Nada que actualizar.');
    return;
  }

  for (const b of result.bumps) console.log(`  ↑ ${b.name}  ${b.from} → ${b.to}`);
  for (const a of result.adds) console.log(`  + ${a.name}  ${a.to} (nueva)`);
  if (result.nodeChange) console.log(`  Node  ${result.nodeChange.from ?? '(sin fijar)'} → ${result.nodeChange.to}`);
  if (result.statusChange) console.log(`  estado de compatibilidad  ${result.statusChange.from} → ${result.statusChange.to}`);
  if (result.profileChange) console.log(`  perfil  ${result.profileChange.from} → ${result.profileChange.to}`);
  if (result.unmanaged.length) console.log(`\n  (se dejan intactas las dependencias agregadas a mano: ${result.unmanaged.join(', ')})`);

  if (values['dry-run']) {
    console.log('\nModo --dry-run: no se escribió nada.');
    return;
  }

  if (!values.yes) {
    const confirmed = await p.confirm({ message: `Aplicar ${result.bumps.length + result.adds.length} cambio(s) de versión a package.json?` });
    if (p.isCancel(confirmed) || !confirmed) {
      console.log('Cancelado. No se escribió nada.');
      return;
    }
  }

  applyUpdate(result);
  const run = { npm: 'npm install', pnpm: 'pnpm install', yarn: 'yarn', bun: 'bun install' }[result.newConfig.packageManager] ?? 'npm install';
  console.log(`\nListo. Reinstalá dependencias (\`${run}\`) y verificá con \`baretta doctor\`.`);
}
