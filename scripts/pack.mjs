#!/usr/bin/env node
// Empaqueta el CLI con `npm pack`, lo instala en un proyecto temporal y lo ejecuta desde ahí.
// Comprueba lo que realmente se publicaría (no el código del repositorio):
//   - el tarball incluye bin, src, templates (con los archivos dot-*) y compatibility
//   - NO incluye tests ni node_modules
//   - `baretta --version` y `baretta create --yes` funcionan desde la instalación empaquetada
//
// No publica nada. Uso: node scripts/pack.mjs

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cli = resolve(import.meta.dirname, '../packages/cli');
const sh = (cmd, cwd) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8' });
const fail = (msg, r) => {
  console.error(`FAIL  ${msg}`);
  if (r) console.error((r.stdout + r.stderr).split('\n').slice(-20).join('\n'));
  process.exit(1);
};

// 1. npm pack (--json da la lista de archivos del tarball)
const packed = sh('npm pack --json', cli);
if (packed.status !== 0) fail('npm pack', packed);
const info = JSON.parse(packed.stdout)[0];
const files = info.files.map((f) => f.path);
console.log(`PASS  npm pack → ${info.filename} (${files.length} archivos, ${(info.size / 1024).toFixed(0)} kB)`);

for (const needed of ['bin/baretta.js', 'src/index.js', 'templates/base/dot-gitignore', 'templates/deployment/dot-dockerignore', 'compatibility/profiles/stable/profile.json']) {
  if (!files.includes(needed)) fail(`el tarball no incluye ${needed}`);
}
if (files.some((f) => f.startsWith('tests/') || f.includes('node_modules/'))) fail('el tarball incluye tests o node_modules');
console.log('PASS  contenido del tarball (incluye plantillas dot-*, excluye tests y node_modules)');

// 2. Instalar el tarball en un proyecto vacío y ejecutarlo
const tarball = join(cli, info.filename);
const tmp = mkdtempSync(join(tmpdir(), 'baretta-pack-'));
try {
  writeFileSync(join(tmp, 'package.json'), '{"name":"pack-test","version":"1.0.0","private":true}');
  const inst = sh(`npm install "${tarball}"`, tmp);
  if (inst.status !== 0) fail('npm install del tarball', inst);
  console.log('PASS  npm install del tarball');

  const ver = sh('npx --no-install baretta --version', tmp);
  const expected = JSON.parse(readFileSync(join(cli, 'package.json'), 'utf8')).version;
  if (ver.status !== 0 || ver.stdout.trim() !== expected) fail(`baretta --version (esperado ${expected})`, ver);
  console.log(`PASS  baretta --version → ${ver.stdout.trim()}`);

  const gen = sh('npx --no-install baretta create demo --backend postgres --auth none --yes --install skip', tmp);
  if (gen.status !== 0 || !existsSync(join(tmp, 'demo', 'package.json')) || !existsSync(join(tmp, 'demo', '.gitignore'))) fail('baretta create desde el paquete', gen);
  console.log('PASS  baretta create desde el paquete instalado (genera proyecto con .gitignore)');
} finally {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(tarball, { force: true });
}
console.log('Empaquetado verificado. No se publicó nada.');
