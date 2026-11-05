import "server-only";
import { Resend } from "resend";
import { requireEnv } from "@/lib/env";

/**
 * Envía un email transaccional con Resend.
 *
 * Es el contrato de envío de todo el proyecto: otros módulos (magic link, OTP,
 * recibos...) importan esta función en lugar de usar el SDK directamente, así
 * cambiar de proveedor de email solo requiere modificar este archivo.
 *
 * Solo para código de servidor (Server Actions, Route Handlers, servicios).
 * Las credenciales se leen al enviar, no al importar, para que `next build` no
 * las exija. Si Resend rechaza el envío (dominio sin verificar, API key
 * inválida, destinatario inválido...) lanza un Error con el motivo.
 *
 * Valida `to` con Zod antes de llamar aquí si proviene de la entrada de un usuario.
 */
export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const { error } = await resend.emails.send({
    // Debe pertenecer a un dominio verificado en Resend (ver docs/extras/resend.md).
    from: requireEnv("EMAIL_FROM"),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  if (error) {
    throw new Error(`No se pudo enviar el email con Resend: ${error.message}`);
  }
}
