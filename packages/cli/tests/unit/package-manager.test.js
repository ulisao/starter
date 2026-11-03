import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectPackageManager, commandsFor } from '../../src/core/package-manager/index.js';

const withDir = (fn) => {
  const dir = mkdtempSync(join(tmpdir(), 'baretta-pm-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('prioriza el gestor que lanzó el CLI (user agent)', () => {
  withDir((dir) => {
    writeFileSync(join(dir, 'yarn.lock'), '');
    assert.equal(detectPackageManager(dir, { npm_config_user_agent: 'pnpm/10.0.0 npm/? node/v22' }), 'pnpm');
  });
});

test('sin user agent usa el lockfile de la carpeta', () => {
  withDir((dir) => {
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
    assert.equal(detectPackageManager(dir, {}), 'pnpm');
  });
  withDir((dir) => {
    writeFileSync(join(dir, 'bun.lock'), '');
    assert.equal(detectPackageManager(dir, {}), 'bun');
  });
});

test('sin pistas cae en npm', () => {
  withDir((dir) => assert.equal(detectPackageManager(dir, {}), 'npm'));
});

test('cada gestor tiene comandos y lockfile propios (no se mezclan lockfiles)', () => {
  const lockfiles = ['npm', 'pnpm', 'yarn', 'bun'].map((pm) => commandsFor(pm).lockfile);
  assert.equal(new Set(lockfiles).size, 4);
});
