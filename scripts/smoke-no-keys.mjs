#!/usr/bin/env node
// Humo: un proyecto Clerk recién generado (SIN claves) debe arrancar `next dev` y mostrar la guía
// "Falta configurar Clerk", no el error "Publishable key not valid".
//
// Genera el proyecto, instala dependencias, levanta `next dev` y consulta `/`. Es lento (hace
// install), por eso corre en el workflow programado y no en cada PR.
//
// Uso: node scripts/smoke-no-keys.mjs [--backend convex|supabase|postgres] [--port 3111] [--keep]

import { parseArgs } from 'node:util';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const { values } = parseArgs({
  options: {
    backend: { type: 'string', default: 'postgres' },
    port: { type: 'string', default: '3111' },
    keep: { type: 'boolean', default: false },
  },
});

const cli = resolve(import.meta.dirname, '../packages/cli/bin/baretta.js');
const shell = process.platform === 'win32';
const work = mkdtempSync(join(tmpdir(), 'baretta-smoke-'));
const dir = join(work, 'app');
let server;

const cleanup = () => {
  if (server && !server.killed) {
    // En Windows hay que matar el árbol de procesos; en el resto basta con el grupo.
    if (shell) spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    else server.kill('SIGTERM');
  }
  if (!values.keep) rmSync(work, { recursive: true, force: true });
};
const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  cleanup();
  process.exit(1);
};

const gen = spawnSync('node', [cli, 'create', 'app', '--dir', dir, '--backend', values.backend, '--auth', 'clerk', '--auth-method', 'google', '--payments', 'none', '--pm', 'npm', '--install', 'skip', '--yes'], { encoding: 'utf8' });
if (gen.status !== 0) fail(`generar proyecto\n${gen.stdout}${gen.stderr}`);

const inst = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir, shell, encoding: 'utf8' });
if (inst.status !== 0) fail(`npm install\n${inst.stderr.slice(-1500)}`);

// Entorno limpio: ninguna variable de Clerk/Convex heredada del equipo.
const env = { ...process.env };
for (const k of Object.keys(env)) if (/^(NEXT_PUBLIC_|CLERK_|CONVEX_)/.test(k)) delete env[k];

let log = '';
server = spawn('npx', ['next', 'dev', '-p', values.port], { cwd: dir, shell, env });
server.stdout.on('data', (d) => (log += d));
server.stderr.on('data', (d) => (log += d));

let body = '';
let status = 0;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const res = await fetch(`http://localhost:${values.port}/`);
    status = res.status;
    body = await res.text();
    break;
  } catch {
    /* el servidor aún no responde */
  }
}

if (status !== 200) fail(`GET / devolvió ${status || 'sin respuesta'}\n${log.slice(-1500)}`);
if (!body.includes('Falta configurar Clerk')) fail(`falta la guía "Falta configurar Clerk" en la respuesta\n${log.slice(-1500)}`);
if (/Publishable key not valid/.test(body)) fail('apareció "Publishable key not valid"');

console.log(`PASS  clerk sin claves (${values.backend}): next dev responde 200 con la guía de configuración`);
cleanup();
