// Integración Clerk + Convex: Convex valida los tokens de sesión de Clerk (convex/auth.config.ts) y el
// navegador usa ConvexProviderWithClerk (se activa con la bandera `isClerk` en la plantilla del provider
// de backend-convex). Solo aplica cuando el backend es Convex; el módulo auth-clerk aporta lo común.

export default {
  id: 'auth-clerk-convex',
  when: (cfg) => cfg.auth === 'clerk' && cfg.backend === 'convex',
  templates: 'auth/clerk-convex',
  slots: {
    convexApiImports: 'import type * as viewer from "../viewer.js";',
    convexApiModules: '  viewer: typeof viewer;',
  },
  env: [
    {
      key: 'CLERK_JWT_ISSUER_DOMAIN',
      description:
        'Variable del deployment de Convex (npx convex env set), NO se lee desde .env.local. Dominio emisor de los tokens de Clerk (Frontend API URL).',
      secret: false,
      example: 'https://tu-instancia.clerk.accounts.dev',
      where: 'Clerk Dashboard → Configure → Developers → API keys (Frontend API URL), tras activar la integración con Convex.',
    },
  ],
  stack: ['Integración Clerk ↔ Convex: Convex valida los tokens de Clerk y las funciones leen `ctx.auth.getUserIdentity()`'],
  notes: [
    'Clerk + Convex: `convex/auth.config.ts` declara a Clerk como emisor (variable `CLERK_JWT_ISSUER_DOMAIN` en el deployment de Convex) y el provider del navegador es `ConvexProviderWithClerk`. Autoriza dentro de cada función con `ctx.auth.getUserIdentity()` (ejemplo: `convex/viewer.ts`).',
  ],
};
