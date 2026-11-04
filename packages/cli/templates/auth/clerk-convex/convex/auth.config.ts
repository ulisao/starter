// Le dice a Convex en qué emisor confiar al validar los tokens de sesión: Clerk.
// CLERK_JWT_ISSUER_DOMAIN es una variable del DEPLOYMENT de Convex (no de .env.local):
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://tu-instancia.clerk.accounts.dev
// Es el "Frontend API URL" de tu instancia de Clerk (Dashboard → Configure → Developers → API keys).
// Antes debes activar la integración con Convex en Clerk (Dashboard → Integrations → Convex).
// Detalle paso a paso en docs/AUTHENTICATION.md.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
