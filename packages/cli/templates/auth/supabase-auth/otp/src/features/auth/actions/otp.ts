"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { describeAuthError } from "../errors";
import { emailOnlySchema } from "../schemas/email-schema";
import { otpVerifySchema } from "../schemas/otp-schema";
import type { AuthState } from "../types";

/**
 * Paso 1: envía un código de un solo uso al correo. Crea la cuenta si no existe.
 * Para que el correo lleve el código (y no solo un enlace) las plantillas de correo de
 * Supabase deben incluir {{ .Token }} (ver docs/AUTHENTICATION.md).
 */
export async function sendOtpCodeAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: parsed.data.email });
  if (error) return { ok: false, message: describeAuthError(error, "No se pudo enviar el código. Inténtalo de nuevo.") };

  return { ok: true, message: "Si el correo es válido, te enviamos un código. Revisa también el spam.", email: parsed.data.email };
}

/** Paso 2: verifica el código y crea la sesión. El código caduca y es de un solo uso. */
export async function verifyOtpCodeAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = otpVerifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      email: typeof formData.get("email") === "string" ? (formData.get("email") as string) : undefined,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: "email" });
  if (error) {
    const message =
      error.code === "otp_expired"
        ? "El código es incorrecto o ya caducó. Pide uno nuevo."
        : describeAuthError(error, "No se pudo verificar el código. Inténtalo de nuevo.");
    return { ok: false, message, email: parsed.data.email };
  }
  redirect("/dashboard");
}
