import type { AuthError } from "@supabase/supabase-js";

/**
 * Convierte un error de Supabase Auth en un mensaje seguro para mostrar al usuario.
 *
 * Los mensajes originales pueden revelar si un correo existe o detalles internos, así
 * que solo se distinguen los casos que el usuario puede resolver. El resto se registra
 * en el servidor (solo código y estado, nunca correos ni tokens) y se muestra `fallback`.
 */
export function describeAuthError(error: AuthError, fallback: string): string {
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
  }
  console.error("[auth]", { code: error.code, status: error.status });
  return fallback;
}
