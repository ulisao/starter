"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { describeAuthError } from "../errors";
import { signInSchema, signUpSchema } from "../schemas/password-schema";
import type { AuthState } from "../types";

// Las Server Actions son endpoints públicos: se valida la entrada con Zod y los errores
// de Supabase no se reenvían tal cual al navegador (ver ../errors.ts).

export async function signInWithPasswordAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Mismo mensaje para "no existe" y "contraseña incorrecta": no revela qué correos tienen cuenta.
    const message =
      error.code === "invalid_credentials"
        ? "Correo o contraseña incorrectos."
        : error.code === "email_not_confirmed"
          ? "Confirma tu correo con el enlace que te enviamos antes de ingresar."
          : describeAuthError(error, "No se pudo iniciar sesión. Inténtalo de nuevo.");
    return { ok: false, message };
  }
  redirect("/dashboard");
}

export async function signUpWithPasswordAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    // El enlace de confirmación vuelve a /auth/callback, que crea la sesión.
    options: { emailRedirectTo: `${siteConfig.url}/auth/callback` },
  });
  if (error) return { ok: false, message: describeAuthError(error, "No se pudo crear la cuenta. Inténtalo de nuevo.") };

  // Con "Confirm email" activado en Supabase no hay sesión hasta que se abre el enlace.
  // Si el correo ya estaba registrado, Supabase responde igual (no revela la cuenta).
  if (data.session) redirect("/dashboard");
  return { ok: true, message: "Si el correo es válido, te enviamos un enlace para confirmar tu cuenta." };
}
