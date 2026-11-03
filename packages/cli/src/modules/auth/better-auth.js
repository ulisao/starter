// Módulo Better Auth para backends con Prisma (PostgreSQL propio y Supabase como base de datos).
// La variante Convex (@convex-dev/better-auth) es un módulo aparte.

const usesGoogle = (cfg) => cfg.authMethod === 'google' || cfg.authMethod === 'password-google';

export default {
  id: 'auth-better-auth',
  when: (cfg) => cfg.auth === 'better-auth' && cfg.backend !== 'convex',
  templates: 'auth/better-auth',
  // Header con login / cierre de sesión en lugar del header base.
  overrides: ['src/components/layout/site-header.tsx'],
  dependencies: ['better-auth'],
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
};
