import "server-only";
import { auth } from "@clerk/nextjs/server";

/**
 * Devuelve el id del usuario autenticado o `null` si no hay sesión.
 *
 * Es el contrato común de todos los módulos de autenticación del starter: otros módulos
 * (pagos, datos del usuario) llaman a esta función y no dependen de Clerk directamente.
 * Solo funciona en el servidor (Server Components, Server Actions, Route Handlers).
 */
export async function getSessionUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
