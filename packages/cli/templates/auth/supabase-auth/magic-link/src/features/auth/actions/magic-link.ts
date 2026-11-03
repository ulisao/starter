"use server";

import { z } from "zod";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { describeAuthError } from "../errors";
import { emailOnlySchema } from "../schemas/email-schema";
import type { AuthState } from "../types";

/**
 * Envía un enlace mágico al correo. Crea la cuenta si no existe (comportamiento por
 * defecto de signInWithOtp). El enlace vuelve a /auth/callback, que crea la sesión;
 * debe abrirse en el mismo navegador donde se pidió (flujo PKCE).
 */
export async function sendMagicLinkAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteConfig.url}/auth/callback` },
  });
  if (error) return { ok: false, message: describeAuthError(error, "No se pudo enviar el enlace. Inténtalo de nuevo.") };

  // Respuesta idéntica exista o no la cuenta.
  return { ok: true, message: "Si el correo es válido, te enviamos un enlace para ingresar. Revisa también el spam." };
}
