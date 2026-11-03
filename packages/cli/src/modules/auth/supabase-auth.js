// Auth: Supabase Auth con la integración SSR oficial (@supabase/ssr).
//
// Es un módulo "núcleo" (clientes, refresco de sesión en proxy.ts, callback, logout,
// header, dashboard de ejemplo) más un módulo pequeño por cada método de acceso, porque
// cada método aporta archivos distintos y el generador no admite archivos condicionales.
// Supabase Auth es una decisión independiente de usar Supabase como base de datos
// (backend-supabase), aunque solo se puede elegir junto con él.

const isSupabaseAuth = (cfg) => cfg.auth === 'supabase-auth';
const withMethod = (...methods) => (cfg) => isSupabaseAuth(cfg) && methods.includes(cfg.authMethod);

export default [
  {
    id: 'auth-supabase-auth',
    when: isSupabaseAuth,
    templates: 'auth/supabase-auth/core',
    // El header base se reemplaza por uno que muestra el estado de la sesión.
    overrides: ['src/components/layout/site-header.tsx'],
    dependencies: ['@supabase/ssr', '@supabase/supabase-js'],
    env: [
      {
        key: 'NEXT_PUBLIC_SUPABASE_URL',
        description: 'URL del proyecto de Supabase. Es pública: llega al navegador.',
        secret: false,
        example: 'https://PROJECT_REF.supabase.co',
        where: 'Supabase Dashboard → Connect (o Project Settings → API) → Project URL.',
      },
      {
        key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        description:
          'Clave publishable (sb_publishable_...) de Supabase. Es pública por diseño; la seguridad la dan RLS y la validación en servidor.',
        secret: false,
        example: 'sb_publishable_XXXXXXXXXXXXXXXXXXXXXXXX',
        where:
          'Supabase Dashboard → Project Settings → API Keys → Publishable key. NUNCA uses aquí la clave secret/service_role.',
      },
    ],
    stack: (cfg) => [`Supabase Auth (\`@supabase/ssr\`) — método: ${cfg.authMethod}`],
    notes: [
      'Supabase Auth: clientes en `src/lib/supabase/` (browser, server) y refresco de sesión en `src/proxy.ts`. Para saber quién es el usuario en el servidor usa `getSessionUserId()` / `getCurrentUser()` de `src/lib/auth/session.ts` (verifican con `getUser()`); nunca uses `getSession()` para autorizar.',
      'Supabase Auth: las rutas de `src/app/(dashboard)/` exigen sesión en su layout; el proxy solo es una capa de conveniencia. La URL `/auth/callback` debe estar en la lista permitida del dashboard (ver `docs/AUTHENTICATION.md`).',
    ],
  },
  {
    id: 'auth-supabase-auth-email',
    // Esquemas y piezas de formulario compartidos por los métodos que piden un correo.
    when: (cfg) => isSupabaseAuth(cfg) && cfg.authMethod !== 'google',
    templates: 'auth/supabase-auth/email',
  },
  {
    id: 'auth-supabase-auth-password',
    when: withMethod('password', 'password-google'),
    templates: 'auth/supabase-auth/password',
  },
  {
    id: 'auth-supabase-auth-google',
    when: withMethod('google', 'password-google'),
    templates: 'auth/supabase-auth/google',
  },
  {
    id: 'auth-supabase-auth-magic-link',
    when: withMethod('magic-link'),
    templates: 'auth/supabase-auth/magic-link',
  },
  {
    id: 'auth-supabase-auth-otp',
    when: withMethod('otp'),
    templates: 'auth/supabase-auth/otp',
  },
];
