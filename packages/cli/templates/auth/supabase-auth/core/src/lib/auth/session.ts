import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Usuario autenticado de la petición actual, o null.
 *
 * Usa `getUser()`, que valida el token contra Supabase. NUNCA uses `getSession()` para
 * decidir permisos en el servidor: lee la cookie sin verificarla y puede estar manipulada.
 * `cache` evita repetir la llamada de red si varios componentes la piden en la misma petición.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});

/**
 * Contrato común de todos los módulos de autenticación: id del usuario autenticado o null.
 * Lo usan otros módulos (por ejemplo pagos) para asociar datos a un usuario sin conocer
 * al proveedor. El id es un UUID (auth.users.id de Supabase).
 */
export async function getSessionUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}
