#!/usr/bin/env node
// Valida un conjunto de combinaciones reales encadenando scripts/validate-project.mjs (genera,
// instala, typecheck, lint, test y build). Es la forma de marcar combinaciones como `verified`.
//
// Uso:
//   node scripts/validate-matrix.mjs                 # subconjunto representativo
//   node scripts/validate-matrix.mjs --full          # toda la matriz (lento: install por combo)
//   node scripts/validate-matrix.mjs --only convex   # solo combinaciones cuyo nombre contenga "convex"
//   node scripts/validate-matrix.mjs --record        # actualiza compatibility/ con lo que pase
//   node scripts/validate-matrix.mjs --dry           # solo genera (sin install/build), para humo rápido
//
// Otras banderas: --pm <npm|pnpm|yarn|bun>  --workdir <dir>  --keep
//
// Las variables de entorno son FALSAS pero con formato válido (algunos SDK validan el formato al
// compilar). Nunca tocan servicios reales: no hay llamadas de red a Clerk/Supabase/Convex/Mercado Pago.

import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const { values } = parseArgs({
  options: {
    full: { type: 'boolean', default: false },
    only: { type: 'string', default: '' },
    record: { type: 'boolean', default: false },
    dry: { type: 'boolean', default: false },
    keep: { type: 'boolean', default: false },
    pm: { type: 'string', default: 'npm' },
    workdir: { type: 'string', default: join(tmpdir(), 'baretta-validate') },
  },
});

// ── Variables de entorno falsas (formato válido) por pieza ──────────────────────
const APP = ['NEXT_PUBLIC_APP_URL=http://localhost:3000'];
const DB = ['DATABASE_URL=postgresql://user:pass@localhost:5432/app?schema=public'];
const CLERK = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k',
  'CLERK_SECRET_KEY=sk_test_0000000000000000000000000000000000000000',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register',
  'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard',
  'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard',
];
const SUPABASE = [
  'NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0000000000000000000000',
  'SUPABASE_SECRET_KEY=sb_secret_0000000000000000000000',
];
const CONVEX = ['NEXT_PUBLIC_CONVEX_URL=https://example-123.convex.cloud'];
const CONVEX_SITE = ['NEXT_PUBLIC_CONVEX_SITE_URL=https://example-123.convex.site'];
const BETTER = ['BETTER_AUTH_SECRET=0000000000000000000000000000000000000000000000', 'BETTER_AUTH_URL=http://localhost:3000'];
// Con un método que incluye Google, Better Auth sobre Prisma instancia el provider al prerenderizar
// (en Convex las credenciales viven en el deployment, no en el build de Next).
const GOOGLE = ['GOOGLE_CLIENT_ID=000000000000-example.apps.googleusercontent.com', 'GOOGLE_CLIENT_SECRET=GOCSPX-0000000000000000000000'];
const MP = ['MERCADOPAGO_ACCESS_TOKEN=TEST-0000000000000000-000000-00000000000000000000000000000000-000000000', 'MERCADOPAGO_WEBHOOK_SECRET=whsec_test_0000000000000000'];
const CONVEX_PAY = ['CONVEX_PAYMENTS_SECRET=0000000000000000000000000000000000000000000000000000000000000000'];

// Calcula las variables de entorno necesarias para compilar una combinación.
function envFor({ backend, auth, payments }) {
  const env = [...APP];
  if (backend === 'postgres') env.push(...DB);
  if (backend === 'supabase') env.push(...DB, ...SUPABASE.slice(0, 0)); // Prisma sobre Supabase usa DATABASE_URL
  if (backend === 'convex') env.push(...CONVEX);
  if (auth === 'clerk') env.push(...CLERK);
  if (auth === 'supabase-auth') env.push(...SUPABASE);
  if (auth === 'better-auth') env.push(...BETTER, ...(backend === 'convex' ? CONVEX_SITE : GOOGLE));
  if (payments && payments !== 'none') {
    env.push(...MP);
    if (backend === 'convex') env.push(...CONVEX_PAY);
  }
  // Supabase como backend (Prisma) también necesita las claves públicas de Supabase si se usan.
  if (backend === 'supabase' && auth !== 'supabase-auth') env.push(...SUPABASE);
  return [...new Set(env)];
}

// ── Matriz ──────────────────────────────────────────────────────────────────────
const AUTH_METHOD = { clerk: 'google', 'better-auth': 'password-google', 'supabase-auth': 'password', 'convex-auth': 'password' };
const m = (backend, auth, extra = {}) => ({ backend, auth, authMethod: auth === 'none' ? null : AUTH_METHOD[auth], ...extra });

// Subconjunto representativo: una combinación por backend + auth, más pagos y extras.
const REPRESENTATIVE = [
  m('postgres', 'none'),
  m('postgres', 'clerk'),
  m('postgres', 'better-auth'),
  m('postgres', 'none', { payments: 'one-time' }),
  m('postgres', 'none', { extras: 'biome,vitest,playwright,github-actions,docker,sentry,rate-limit,analytics,resend,ai,storage' }),
  m('supabase', 'none'),
  m('supabase', 'supabase-auth'),
  m('supabase', 'better-auth'),
  m('convex', 'none'),
  m('convex', 'convex-auth'),
  m('convex', 'clerk'),
  m('convex', 'better-auth'),
  m('convex', 'none', { payments: 'subscription' }),
  m('convex', 'clerk', { payments: 'one-time' }),
];

// Matriz completa: cada backend × cada auth válida × (sin pagos / one-time / subscription).
const BACKENDS = {
  postgres: ['none', 'clerk', 'better-auth'],
  supabase: ['none', 'supabase-auth', 'clerk', 'better-auth'],
  convex: ['none', 'convex-auth', 'clerk', 'better-auth'],
};
const FULL = [];
for (const [backend, auths] of Object.entries(BACKENDS)) {
  for (const auth of auths) {
    FULL.push(m(backend, auth));
    FULL.push(m(backend, auth, { payments: 'one-time' }));
    FULL.push(m(backend, auth, { payments: 'subscription' }));
  }
}

const name = (c) => `${c.backend}-${c.auth}${c.payments ? `-${c.payments}` : ''}${c.extras ? '-extras' : ''}`;
let combos = (values.full ? FULL : REPRESENTATIVE).map((c) => ({ ...c, name: name(c) }));
if (values.only) combos = combos.filter((c) => c.name.includes(values.only));

if (!combos.length) {
  console.error(`Sin combinaciones que coincidan con --only "${values.only}".`);
  process.exit(1);
}

console.log(`Matriz: ${combos.length} combinaciones (${values.full ? 'completa' : 'representativa'})${values.dry ? ' — modo seco' : ''}, gestor ${values.pm}.`);

const project = resolve(import.meta.dirname, 'validate-project.mjs');
const results = [];
for (const c of combos) {
  const args = [
    project,
    '--name', c.name,
    '--backend', c.backend,
    '--auth', c.auth,
    '--pm', values.pm,
    '--workdir', values.workdir,
  ];
  if (c.authMethod) args.push('--auth-method', c.authMethod);
  if (c.payments) args.push('--payments', c.payments);
  if (c.extras) args.push('--extras', c.extras);
  if (values.keep) args.push('--keep');
  if (values.record && !values.dry) args.push('--record');
  if (values.dry) args.push('--generate-only');
  for (const kv of envFor(c)) args.push('--env', kv);

  console.log(`\n──────── ${c.name} ────────`);
  const t = Date.now();
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  const ok = r.status === 0;
  results.push({ name: c.name, ok, seconds: ((Date.now() - t) / 1000).toFixed(0) });
}

console.log('\n════════ Resumen ════════');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(32)} ${r.seconds}s`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} combinaciones OK.`);
if (values.dry) console.log('Modo seco: solo se verificó la generación (sin install/build), no se marcó nada como verified.');
process.exit(failed.length ? 1 : 0);
