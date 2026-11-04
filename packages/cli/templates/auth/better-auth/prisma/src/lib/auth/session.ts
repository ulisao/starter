import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { AppError } from "@/lib/errors";
import { getAuth } from "./auth";

/**
 * Sesión actual leída desde las cookies de la petición (verifica contra la base de datos).
 * `cache` evita consultar varias veces dentro de una misma petición.
 */
export const getSession = cache(async () => getAuth().api.getSession({ headers: await headers() }));

/**
 * Contrato entre módulos: devuelve el id del usuario autenticado o null.
 * Lo usan otros módulos (por ejemplo pagos) sin conocer Better Auth.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
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
