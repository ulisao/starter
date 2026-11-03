"use server";

import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Inicia el flujo OAuth con Google (PKCE). Supabase devuelve la URL de Google; al
 * terminar, Google vuelve a Supabase y este redirige a /auth/callback con un `code`.
 * Requiere habilitar el proveedor Google en el dashboard (ver docs/AUTHENTICATION.md).
 */
export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteConfig.url}/auth/callback` },
  });
  if (error || !data.url) {
    console.error("[auth]", { code: error?.code, status: error?.status });
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}
