// Detección y uso de package managers (npm, pnpm, yarn, bun).
//
// No se asume Corepack: se invoca el binario directamente. Si el package manager
// elegido no está instalado, `isAvailable` lo informa para que el wizard avise.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const LOCKFILES = [
  ['pnpm', 'pnpm-lock.yaml'],
  ['yarn', 'yarn.lock'],
  ['bun', 'bun.lockb'],
  ['bun', 'bun.lock'],
  ['npm', 'package-lock.json'],
];

/**
 * Orden de prioridad:
 *  1. El gestor que lanzó el CLI (npm_config_user_agent: `pnpm dlx baretta` → pnpm).
 *  2. Un lockfile en la carpeta desde la que se ejecuta.
 *  3. npm como último recurso.
 */
export function detectPackageManager(cwd = process.cwd(), env = process.env) {
  const agent = env.npm_config_user_agent?.split('/')[0];
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(agent)) return agent;
  for (const [pm, file] of LOCKFILES) if (existsSync(join(cwd, file))) return pm;
  return 'npm';
}

/** Comandos equivalentes por gestor (se usan en plantillas, docs y en la instalación). */
export function commandsFor(pm) {
  const table = {
    npm: { install: 'npm install', ci: 'npm ci', run: 'npm run', exec: 'npx', lockfile: 'package-lock.json' },
    pnpm: { install: 'pnpm install', ci: 'pnpm install --frozen-lockfile', run: 'pnpm', exec: 'pnpm dlx', lockfile: 'pnpm-lock.yaml' },
    yarn: { install: 'yarn install', ci: 'yarn install --frozen-lockfile', run: 'yarn', exec: 'yarn dlx', lockfile: 'yarn.lock' },
    bun: { install: 'bun install', ci: 'bun install --frozen-lockfile', run: 'bun run', exec: 'bunx', lockfile: 'bun.lock' },
  };
  return table[pm];
}

const useShell = process.platform === 'win32'; // npm/pnpm son .cmd en Windows

export function isAvailable(pm) {
  const r = spawnSync(pm, ['--version'], { shell: useShell, stdio: 'ignore' });
  return r.status === 0;
}

/** Ejecuta `<pm> install` en `cwd`. Resuelve { ok, code }; nunca lanza ni borra nada. */
export function install(pm, cwd) {
  return new Promise((resolve) => {
    const child = spawn(pm, ['install'], { cwd, shell: useShell, stdio: 'inherit' });
    child.on('error', () => resolve({ ok: false, code: -1 }));
    child.on('close', (code) => resolve({ ok: code === 0, code }));
  });
}
