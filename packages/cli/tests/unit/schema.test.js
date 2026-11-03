import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, defaultConfig } from '../../src/core/configuration/schema.js';

const cfg = (over = {}) => ({ ...defaultConfig(), ...over });

test('la configuración por defecto es válida', () => {
  assert.deepEqual(validateConfig(cfg()).errors, []);
});

test('rechaza nombres de proyecto inválidos', () => {
  for (const name of ['Mi App', '-x', '', 'a/b']) assert.ok(validateConfig(cfg({ name })).errors.length, name);
});

test('Supabase Auth solo con backend Supabase', () => {
  const r = validateConfig(cfg({ backend: 'postgres', auth: 'supabase-auth', authMethod: 'password' }));
  assert.match(r.errors.join(), /Supabase Auth solo funciona con/);
  assert.deepEqual(validateConfig(cfg({ backend: 'supabase', auth: 'supabase-auth', authMethod: 'password' })).errors, []);
});

test('Convex Auth solo con Convex', () => {
  assert.ok(validateConfig(cfg({ backend: 'supabase', auth: 'convex-auth', authMethod: 'password' })).errors.length);
  assert.deepEqual(validateConfig(cfg({ backend: 'convex', auth: 'convex-auth', authMethod: 'google' })).errors, []);
});

test('con auth hace falta método; sin auth no puede haberlo', () => {
  assert.ok(validateConfig(cfg({ auth: 'clerk', authMethod: null })).errors.length);
  assert.ok(validateConfig(cfg({ auth: 'none', authMethod: 'password' })).errors.length);
});

test('pagos: requiere tipo válido y proveedor mercadopago', () => {
  assert.ok(validateConfig(cfg({ payments: { enabled: true, provider: 'mercadopago', type: null } })).errors.length);
  assert.ok(validateConfig(cfg({ payments: { enabled: true, provider: 'stripe', type: 'one-time' } })).errors.length);
  assert.deepEqual(validateConfig(cfg({ payments: { enabled: true, provider: 'mercadopago', type: 'subscription' } })).errors, []);
  assert.ok(validateConfig(cfg({ payments: { enabled: false, provider: null, type: 'one-time' } })).errors.length);
});

test('extras desconocidos o duplicados se rechazan', () => {
  assert.ok(validateConfig(cfg({ extras: ['nope'] })).errors.length);
  assert.ok(validateConfig(cfg({ extras: ['biome', 'biome'] })).errors.length);
});

test('magic link sin Resend en Better Auth genera advertencia, no error', () => {
  const r = validateConfig(cfg({ auth: 'better-auth', authMethod: 'magic-link' }));
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.length);
});
