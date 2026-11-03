"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión de este dispositivo y vuelve al inicio.
 * `scope: "local"` no toca las sesiones abiertas en otros dispositivos; cambia a
 * "global" si quieres cerrarlas todas (por ejemplo en un botón "cerrar todas las sesiones").
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
