// Módulos Better Auth. Tres piezas que se combinan según el backend:
//   auth-better-auth-ui      interfaz y cliente comunes (formularios, menú de usuario, header, proxy).
//   auth-better-auth         servidor con adaptador Prisma (PostgreSQL propio y Supabase como base de datos).
//   auth-better-auth-convex  servidor dentro de Convex mediante @convex-dev/better-auth.
// Las tres comparten el contrato `getSessionUserId()` de src/lib/auth/session.ts.

const usesGoogle = (cfg) => cfg.authMethod === 'google' || cfg.authMethod === 'password-google';
const isBetterAuth = (cfg) => cfg.auth === 'better-auth';
const needsResendVars = (cfg) => ['magic-link', 'otp'].includes(cfg.authMethod) && cfg.extras.includes('resend');

// Las variables marcadas con convexSide las lee el CÓDIGO DE CONVEX (convex/auth.ts), no Next.js:
// se guardan en el deployment con `npx convex env set`. Se listan para .env.example y la documentación.
const convexSide = 'Variable del deployment de Convex (npx convex env set), NO se lee desde .env.local. ';

export default [
  {
    id: 'auth-better-auth-ui',
    when: isBetterAuth,
    templates: 'auth/better-auth/ui',
    // Header con login / cierre de sesión en lugar del header base.
    overrides: ['src/components/layout/site-header.tsx'],
    dependencies: ['better-auth'],
  },
  {
    id: 'auth-better-auth',
    when: (cfg) => isBetterAuth(cfg) && cfg.backend !== 'convex',
    templates: 'auth/better-auth/prisma',
    env: (cfg) => [
      {
        key: 'BETTER_AUTH_SECRET',
        description: 'Clave con la que Better Auth firma sesiones y tokens (mínimo 32 caracteres aleatorios).',
        secret: true,
        example: '',
        where: 'Genera una con `openssl rand -base64 32` (o `npx @better-auth/cli secret`). Nunca la subas al repositorio.',
      },
      {
        key: 'BETTER_AUTH_URL',
        description: 'URL pública de la aplicación (sin barra final) que Better Auth usa para callbacks y enlaces.',
        secret: false,
        example: 'http://localhost:3000',
        where: 'En desarrollo: http://localhost:3000. En producción: tu dominio (ej: https://miapp.com).',
      },
      ...(usesGoogle(cfg)
        ? [
            {
              key: 'GOOGLE_CLIENT_ID',
              description: 'ID de cliente OAuth de Google.',
              secret: true,
              example: '',
              where: 'Google Cloud Console → APIs y servicios → Credenciales (ver docs/AUTHENTICATION.md).',
            },
            {
              key: 'GOOGLE_CLIENT_SECRET',
              description: 'Secreto de cliente OAuth de Google.',
              secret: true,
              example: '',
              where: 'Google Cloud Console → APIs y servicios → Credenciales (ver docs/AUTHENTICATION.md).',
            },
          ]
        : []),
    ],
    stack: (cfg) => [`Better Auth (${cfg.authMethod}) con adaptador Prisma, sesiones en base de datos`],
    notes: [
      'Auth: Better Auth. Servidor en `src/lib/auth/auth.ts` (`getAuth()`), cliente en `src/lib/auth/auth-client.ts`, sesión en `src/lib/auth/session.ts` (`getSessionUserId()`, `requireUserId()`). Los modelos están en `prisma/schema/auth.prisma`: tras clonar ejecuta `db:migrate`.',
      'Auth: `src/proxy.ts` solo hace un chequeo optimista de cookie; la autorización real va en el servidor (layout de `(dashboard)` y `requireUserId()`). Ver `docs/AUTHENTICATION.md`.',
    ],
  },
  {
    id: 'auth-better-auth-convex',
    when: (cfg) => isBetterAuth(cfg) && cfg.backend === 'convex',
    templates: 'auth/better-auth/convex',
    dependencies: ['@convex-dev/better-auth'],
    // Módulos de convex/ que aporta esta integración, para el api.d.ts pregenerado de backend-convex.
    slots: {
      convexApiImports: ['import type * as auth from "../auth.js";', 'import type * as http from "../http.js";'],
      convexApiModules: ['  auth: typeof auth;', '  http: typeof http;'],
      convexComponents: '  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;',
    },
    env: (cfg) => [
      {
        key: 'NEXT_PUBLIC_CONVEX_SITE_URL',
        description: 'URL del deployment de Convex que termina en .convex.site (rutas HTTP de Better Auth). Es pública.',
        secret: false,
        example: 'https://tu-deployment.convex.site',
        where: 'Convex Dashboard → Settings → URL & Deploy Key → HTTP Actions URL.',
      },
      {
        key: 'BETTER_AUTH_SECRET',
        description: convexSide + 'Clave con la que Better Auth firma sesiones y tokens (mínimo 32 caracteres aleatorios).',
        secret: true,
        example: '',
        where: 'Genérala con `openssl rand -base64 32` y guárdala con `npx convex env set BETTER_AUTH_SECRET ...`.',
      },
      {
        key: 'SITE_URL',
        description: convexSide + 'URL pública de la aplicación Next.js (sin barra final); Better Auth la usa para callbacks y enlaces.',
        secret: false,
        example: 'http://localhost:3000',
        where: 'En desarrollo: http://localhost:3000. En producción: tu dominio, en el deployment de producción.',
      },
      ...(usesGoogle(cfg)
        ? [
            {
              key: 'GOOGLE_CLIENT_ID',
              description: convexSide + 'ID de cliente OAuth de Google.',
              secret: true,
              example: '',
              where: 'Google Cloud Console → APIs y servicios → Credenciales (ver docs/AUTHENTICATION.md).',
            },
            {
              key: 'GOOGLE_CLIENT_SECRET',
              description: convexSide + 'Secreto de cliente OAuth de Google.',
              secret: true,
              example: '',
              where: 'Google Cloud Console → APIs y servicios → Credenciales (ver docs/AUTHENTICATION.md).',
            },
          ]
        : []),
      ...(needsResendVars(cfg)
        ? [
            {
              key: 'AUTH_RESEND_KEY',
              description: convexSide + 'API key de Resend para enviar los enlaces o códigos de acceso.',
              secret: true,
              example: '',
              where: 'Resend Dashboard → API Keys.',
            },
            {
              key: 'AUTH_EMAIL_FROM',
              description: convexSide + 'Remitente de los emails de acceso, de un dominio verificado en Resend.',
              secret: false,
              example: 'Mi App <acceso@tudominio.com>',
              where: 'Resend Dashboard → Domains.',
            },
          ]
        : []),
    ],
    stack: (cfg) => [`Better Auth (${cfg.authMethod}) dentro de Convex (@convex-dev/better-auth), reenviado desde Next.js`],
    notes: [
      'Auth: Better Auth dentro de Convex. Servidor en `convex/auth.ts` (`createAuth`, `authComponent`, `getCurrentUser`), rutas HTTP en `convex/http.ts`, cliente en `src/lib/auth/auth-client.ts` y sesión en `src/lib/auth/session.ts` (`getSessionUserId()`, `requireUserId()`). Los usuarios viven en el componente de Better Auth, no en `schema.ts`.',
      'Auth: BETTER_AUTH_SECRET, SITE_URL y credenciales de terceros se guardan en el DEPLOYMENT de Convex (`npx convex env set`), no en .env.local. `better-auth` queda en 1.6.x porque el componente lo exige.',
      'Auth: `src/proxy.ts` solo hace un chequeo optimista de cookie; la autorización real va en el servidor (layout de `(dashboard)`, `requireUserId()`) y dentro de cada función de Convex. Ver `docs/AUTHENTICATION.md`.',
    ],
  },
];
