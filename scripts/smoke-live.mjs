#!/usr/bin/env node
// Humo contra servicios REALES (opt-in). Comprueba que las credenciales que usan las plantillas
// se aceptan en cada proveedor. NO crea ni modifica nada: solo hace lecturas.
//
// Cada comprobación se omite si falta su variable de entorno, así se puede correr con las que
// tengas. Usa credenciales de PRUEBA/sandbox, nunca de producción.
//
//   CLERK_SECRET_KEY             → GET api.clerk.com/v1/users?limit=1
//   MERCADOPAGO_ACCESS_TOKEN     → GET api.mercadopago.com/users/me
//   RESEND_API_KEY               → GET api.resend.com/domains
//   NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY → GET <url>/auth/v1/settings
//   NEXT_PUBLIC_CONVEX_URL       → GET <url>/version
//
// Uso: node scripts/smoke-live.mjs        (sale con código 1 si alguna comprobación ejecutada falla)

const env = process.env;

const checks = [
  {
    name: 'Clerk',
    needs: ['CLERK_SECRET_KEY'],
    run: () => fetch('https://api.clerk.com/v1/users?limit=1', { headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` } }),
  },
  {
    name: 'Mercado Pago',
    needs: ['MERCADOPAGO_ACCESS_TOKEN'],
    run: () => fetch('https://api.mercadopago.com/users/me', { headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` } }),
  },
  {
    name: 'Resend',
    needs: ['RESEND_API_KEY'],
    run: () => fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } }),
  },
  {
    name: 'Supabase',
    needs: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
    run: () => fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } }),
  },
  {
    name: 'Convex',
    needs: ['NEXT_PUBLIC_CONVEX_URL'],
    run: () => fetch(`${env.NEXT_PUBLIC_CONVEX_URL}/version`),
  },
];

let failed = 0;
let ran = 0;
for (const c of checks) {
  const missing = c.needs.filter((k) => !env[k]);
  if (missing.length) {
    console.log(`SKIP  ${c.name} (falta ${missing.join(', ')})`);
    continue;
  }
  ran++;
  try {
    const res = await c.run();
    if (res.ok) console.log(`PASS  ${c.name} (HTTP ${res.status})`);
    else {
      failed++;
      console.error(`FAIL  ${c.name}: HTTP ${res.status}`);
    }
  } catch (e) {
    failed++;
    console.error(`FAIL  ${c.name}: ${e.message}`);
  }
}

console.log(`\n${ran} comprobaciones ejecutadas, ${failed} con error.`);
process.exit(failed ? 1 : 0);
