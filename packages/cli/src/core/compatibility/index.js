// Sistema centralizado de compatibilidad de versiones.
//
// NINGÚN archivo del generador ni de las plantillas fija versiones por su cuenta.
// Todas las versiones salen del perfil de compatibilidad:
//
//   compatibility/profiles/<perfil>/profile.json       metadatos y rango de Node
//   compatibility/profiles/<perfil>/packages/*.json    una ficha por paquete
//   compatibility/combinations/*.json                  estado de cada combinación
//
// Para actualizar versiones se editan esos JSON, sin tocar el código del CLI.
// Ver docs/COMPATIBILITY.md para el procedimiento completo.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../compatibility/', import.meta.url));

// Del mejor al peor estado. El estado global de un proyecto es el PEOR de todos
// los componentes que incluye: nunca se presenta como verified algo que no lo es.
export const STATUS_ORDER = ['verified', 'candidate', 'experimental', 'unsupported'];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** Peor estado de una lista. */
export function worstStatus(statuses) {
  return statuses.reduce((worst, s) => (STATUS_ORDER.indexOf(s) > STATUS_ORDER.indexOf(worst) ? s : worst), 'verified');
}

/** Carga un perfil completo: metadatos + fichas de paquetes indexadas por nombre npm. */
export function loadProfile(name = 'stable') {
  const dir = join(ROOT, 'profiles', name);
  if (!existsSync(join(dir, 'profile.json'))) throw new Error(`Perfil de compatibilidad desconocido: "${name}".`);
  const profile = readJson(join(dir, 'profile.json'));
  const packages = {};
  const pkgDir = join(dir, 'packages');
  for (const file of readdirSync(pkgDir).filter((f) => f.endsWith('.json'))) {
    const entry = readJson(join(pkgDir, file));
    if (packages[entry.name]) throw new Error(`Paquete duplicado en el perfil ${name}: ${entry.name}`);
    packages[entry.name] = entry;
  }
  return { ...profile, packages };
}

/** Carga todas las combinaciones registradas. */
export function loadCombinations() {
  const dir = join(ROOT, 'combinations');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readJson(join(dir, f)));
}

/**
 * Resuelve la compatibilidad de una configuración.
 * - Busca la combinación backend+auth registrada.
 * - Aplica las versiones que esa combinación sobreescribe (ej: better-auth 1.6.x con Convex).
 * - Calcula el estado global.
 */
export function resolveCompatibility(cfg, profile) {
  const combo = loadCombinations().find((c) => c.backend === cfg.backend && c.auth === cfg.auth) ?? null;
  const overrides = combo?.overrides ?? {};
  if (combo?.status === 'unsupported') {
    throw new Error(`Combinación no soportada (${cfg.backend} + ${cfg.auth}): ${combo.notes ?? 'sin detalle'}`);
  }
  const versionOf = (pkg) => {
    const entry = profile.packages[pkg];
    if (!entry) throw new Error(`El perfil "${profile.name}" no define el paquete "${pkg}". Agregá compatibility/profiles/${profile.name}/packages/<archivo>.json`);
    return overrides[pkg] ?? entry.version;
  };
  return { combo, overrides, versionOf };
}

/** Estado global = peor entre la combinación y los paquetes realmente incluidos. */
export function overallStatus({ combo }, profile, packageNames) {
  const statuses = [combo?.status ?? 'candidate'];
  for (const p of packageNames) statuses.push(profile.packages[p]?.status ?? 'candidate');
  return worstStatus(statuses);
}
