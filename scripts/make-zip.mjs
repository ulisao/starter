#!/usr/bin/env node
// Crea baretta-starter.zip con el repositorio completo: código, documentación, tests y plantillas.
// Excluye lo ignorado por git (node_modules, logs, .env...) y el propio ZIP. Usa `git ls-files`,
// así que lo que no esté versionado ni sea "no ignorado" no entra (nunca secretos ni temporales).
// Requiere `tar` con soporte zip (bsdtar: incluido en Windows 10+ y macOS).
//
// Uso: node scripts/make-zip.mjs [salida.zip]

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(process.argv[2] ?? join(root, 'baretta-starter.zip'));

const ls = spawnSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
if (ls.status !== 0) throw new Error(`git ls-files falló: ${ls.stderr}`);
const files = ls.stdout.split('\n').filter((f) => f && !f.endsWith('.zip'));

// Salvaguarda: nada que parezca un secreto o un directorio de dependencias.
const bad = files.filter((f) => /(^|\/)(node_modules|\.env(\..*)?)$/.test(f) && !f.endsWith('.env.example'));
if (bad.length) throw new Error(`Archivos prohibidos en el ZIP: ${bad.join(', ')}`);

const tmp = mkdtempSync(join(tmpdir(), 'baretta-zip-'));
const list = join(tmp, 'files.txt');
writeFileSync(list, files.join('\n') + '\n');
// En Windows, el GNU tar de Git Bash interpreta el `C:` de una ruta absoluta como un host remoto.
// Pasar la salida relativa al cwd (cuando queda dentro del repo) evita el colon y funciona igual en
// bsdtar. `--force-local` es la red de seguridad para GNU tar si la ruta aún llevara `:`.
const relOut = relative(root, out);
const outArg = !isAbsolute(relOut) && !relOut.startsWith('..') ? relOut : out;
const r = spawnSync('tar', ['--force-local', '-a', '-cf', outArg, '-T', list], { cwd: root, encoding: 'utf8' });
rmSync(tmp, { recursive: true, force: true });
if (r.status !== 0) throw new Error(`tar falló: ${r.stderr}`);
console.log(`ZIP creado: ${out} (${files.length} archivos, ${(statSync(out).size / 1024).toFixed(0)} kB)`);
