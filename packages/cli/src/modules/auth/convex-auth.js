// Autenticación: Convex Auth (@convex-dev/auth). EXPERIMENTAL: la librería está en 0.0.x.
// Vive dentro de Convex (las sesiones y usuarios son tablas de tu deployment); en Next.js solo hay un
// proxy que mantiene cookies, un provider de servidor y el helper `getSessionUserId`.
//
// Aporta al schema de Convex mediante los slots que define backend-convex (ver backend/convex.js):
//   convexSchemaImports → import de `authTables`;  convexSchemaTables → `...authTables,`.

const isMagicOrOtp = (cfg) => cfg.authMethod === 'magic-link' || cfg.authMethod === 'otp';
const hasResend = (cfg) => cfg.extras.includes('resend');
const hasGoogle = (cfg) => cfg.authMethod === 'google' || cfg.authMethod === 'password-google';

// Las variables de abajo las lee el CÓDIGO DE CONVEX (convex/auth.ts), no Next.js: se guardan en el
// deployment con `npx convex env set`. Se listan aquí para que aparezcan en .env.example y en la doc.
const convexSide = 'Variable del deployment de Convex (npx convex env set), NO se lee desde .env.local. ';

export default {
  id: 'auth-convex-auth',
  when: (cfg) => cfg.auth === 'convex-auth',
  templates: 'auth/convex-auth',
  dependencies: ['@convex-dev/auth', '@auth/core'],
  providers: [
    {
      importLine: 'import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";',
      open: '<ConvexAuthNextjsServerProvider>',
      close: '</ConvexAuthNextjsServerProvider>',
      order: 10, // más externo que ConvexClientProvider (order 20), como exige la librería
    },
  ],
  slots: {
    convexSchemaImports: 'import { authTables } from "@convex-dev/auth/server";',
    convexSchemaTables: '  ...authTables,',
    convexApiImports: ['import type * as auth from "../auth.js";', 'import type * as http from "../http.js";', 'import type * as users from "../users.js";'],
    convexApiModules: ['  auth: typeof auth;', '  http: typeof http;', '  users: typeof users;'],
  },
  env: (cfg) => [
    {
      key: 'SITE_URL',
      description: convexSide + 'URL de la aplicación; se usa en redirecciones y enlaces de acceso.',
      secret: false,
      example: 'http://localhost:3000',
      where: 'La configura `npx @convex-dev/auth`. En producción: tu dominio.',
    },
    {
      key: 'JWT_PRIVATE_KEY',
      description: convexSide + 'Clave privada con la que Convex firma los tokens de sesión.',
      secret: true,
      example: '',
      where: 'La genera y guarda `npx @convex-dev/auth`. Cada deployment (dev/prod) necesita la suya.',
    },
    {
      key: 'JWKS',
      description: convexSide + 'Clave pública correspondiente a JWT_PRIVATE_KEY.',
      secret: true,
      example: '',
      where: 'La genera y guarda `npx @convex-dev/auth` junto con JWT_PRIVATE_KEY.',
    },
    ...(hasGoogle(cfg)
      ? [
          {
            key: 'AUTH_GOOGLE_ID',
            description: convexSide + 'Client ID de OAuth de Google.',
            secret: true,
            example: '',
            where: 'Google Cloud Console → APIs y servicios → Credenciales → ID de cliente OAuth (ver docs/AUTHENTICATION.md).',
          },
          {
            key: 'AUTH_GOOGLE_SECRET',
            description: convexSide + 'Client secret de OAuth de Google.',
            secret: true,
            example: '',
            where: 'Google Cloud Console, en la misma credencial.',
          },
        ]
      : []),
    ...(isMagicOrOtp(cfg) && hasResend(cfg)
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
  stack: ['Convex Auth (@convex-dev/auth, experimental) integrado con Next.js mediante proxy + provider de servidor'],
  notes: [
    'Convex Auth (EXPERIMENTAL, 0.0.x): la API puede cambiar entre versiones y su soporte para Next.js es limitado (ver `docs/AUTHENTICATION.md`). No lo uses en producción crítica sin validar tu flujo completo.',
    'Convex Auth: configuración en `convex/auth.ts`, rutas HTTP en `convex/http.ts`, proxy en `src/proxy.ts` y helper de servidor `getSessionUserId()` en `src/lib/auth/session.ts`. Las claves (JWT_PRIVATE_KEY, JWKS, SITE_URL) se guardan en el deployment de Convex con `npx @convex-dev/auth`, no en .env.local.',
    'Convex Auth: autoriza dentro de cada función de Convex con `getAuthUserId(ctx)`; el proxy solo redirige por comodidad.',
  ],
};
