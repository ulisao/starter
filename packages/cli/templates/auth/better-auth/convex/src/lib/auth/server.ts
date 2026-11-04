import "server-only";
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { requireEnv } from "@/lib/env";

type AuthServer = ReturnType<typeof convexBetterAuthNextJs>;
const globalForAuth = globalThis as unknown as { convexAuthServer?: AuthServer };

/**
 * Utilidades de Better Auth para el servidor de Next.js (handler HTTP, token de sesión, consultas
 * autenticadas a Convex). Se crea en el primer uso, no al importar, para que `next build` no exija
 * variables de entorno que solo existen en el entorno real.
 *
 * NEXT_PUBLIC_CONVEX_SITE_URL es la URL del deployment que termina en `.convex.site` (distinta de
 * NEXT_PUBLIC_CONVEX_URL, que termina en `.convex.cloud`).
 */
export function getAuthServer(): AuthServer {
  globalForAuth.convexAuthServer ??= convexBetterAuthNextJs({
    convexUrl: requireEnv("NEXT_PUBLIC_CONVEX_URL"),
    convexSiteUrl: requireEnv("NEXT_PUBLIC_CONVEX_SITE_URL"),
  });
  return globalForAuth.convexAuthServer;
}
