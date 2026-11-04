import "server-only";
import { cache } from "react";
import { AppError } from "@/lib/errors";
import { api } from "../../../convex/_generated/api";
import { getAuthServer } from "./server";

/**
 * Usuario autenticado en el servidor de Next.js, o null si no hay sesión.
 *
 * Lee el token de las cookies y se lo pasa a Convex, que es quien lo verifica (la identidad nunca
 * sale de un dato que mande el cliente). `cache` evita repetir la consulta dentro de una petición.
 */
export const getSessionUser = cache(async () => {
  const { isAuthenticated, fetchAuthQuery } = getAuthServer();
  if (!(await isAuthenticated())) return null;
  return await fetchAuthQuery(api.auth.getCurrentUser, {});
});

/**
 * Contrato entre módulos: devuelve el id del usuario autenticado o null.
 * Lo usan otros módulos (por ejemplo pagos) sin conocer Better Auth.
 */
export async function getSessionUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

/**
 * Exige un usuario autenticado. Úsala al inicio de Server Actions y Route Handlers:
 * lanza AppError 401, que `errorResponse` convierte en una respuesta JSON.
 */
export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new AppError("Debes iniciar sesión.", 401, "unauthorized");
  return userId;
}
