import "server-only";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

/**
 * Usuario autenticado en el servidor de Next.js, o null si no hay sesión.
 *
 * Lee el token de sesión de las cookies y se lo pasa a Convex, que es quien lo verifica
 * (la identidad nunca sale de un dato que mande el cliente). Úsalo en Server Components,
 * Server Actions y Route Handlers.
 */
export async function getSessionUser() {
  const token = await convexAuthNextjsToken();
  if (!token) return null;
  return await fetchQuery(api.users.viewer, {}, { token });
}

/**
 * Contrato del starter: id del usuario autenticado o null. Otros módulos (pagos, por ejemplo)
 * lo usan para saber quién actúa sin conocer qué proveedor de autenticación hay debajo.
 */
export async function getSessionUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}
