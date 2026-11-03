import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadProfile, loadCombinations, worstStatus, resolveCompatibility, STATUS_ORDER } from '../../src/core/compatibility/index.js';

const profile = loadProfile('stable');

test('el perfil stable declara Node y versiones exactas (sin latest ni rangos)', () => {
  assert.match(profile.node, />=22/);
  for (const e of Object.values(profile.packages)) {
    assert.match(e.version, /^\d+\.\d+\.\d+$/, `${e.name}: versión no exacta "${e.version}"`);
    assert.ok(STATUS_ORDER.includes(e.status), `${e.name}: estado inválido`);
    assert.ok(e.sources?.length, `${e.name}: falta fuente oficial`);
  }
});

test('Prisma es 7.x estable y TypeScript no es 7.x (decisiones documentadas del perfil)', () => {
  assert.match(profile.packages.prisma.version, /^7\./);
  assert.match(profile.packages.typescript.version, /^5\./);
});

test('worstStatus devuelve el peor estado', () => {
  assert.equal(worstStatus(['verified', 'verified']), 'verified');
  assert.equal(worstStatus(['verified', 'candidate']), 'candidate');
  assert.equal(worstStatus(['candidate', 'experimental', 'verified']), 'experimental');
});

test('toda combinación tiene estado válido y la fecha de verificación solo si es verified', () => {
  for (const c of loadCombinations()) {
    assert.ok(STATUS_ORDER.includes(c.status), c.id);
    if (c.status === 'verified') assert.ok(c.verifiedAt, `${c.id}: verified sin fecha`);
  }
});

test('Convex + Better Auth fija better-auth 1.6.x (peer de @convex-dev/better-auth)', () => {
  const { versionOf } = resolveCompatibility({ backend: 'convex', auth: 'better-auth' }, profile);
  assert.match(versionOf('better-auth'), /^1\.6\./);
  const other = resolveCompatibility({ backend: 'postgres', auth: 'better-auth' }, profile);
  assert.match(other.versionOf('better-auth'), /^1\.7\./);
});

test('pedir un paquete que el perfil no define falla con un mensaje accionable', () => {
  const { versionOf } = resolveCompatibility({ backend: 'postgres', auth: 'none' }, profile);
  assert.throws(() => versionOf('no-existe'), /no define el paquete/);
});
