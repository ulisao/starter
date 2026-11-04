import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

// Le dice a Convex en qué emisor confiar al validar los tokens de sesión: el propio Better Auth
// (que corre dentro de Convex). Normalmente no necesitas editar este archivo.
export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
