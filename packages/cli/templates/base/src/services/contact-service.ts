import type { ContactInput } from "@/features/contact/schemas/contact-schema";

/**
 * Lógica de negocio del formulario de contacto.
 *
 * Los servicios (src/services) contienen reglas reutilizables y NO conocen HTTP,
 * formularios ni React: reciben datos ya validados. Así se pueden llamar desde una
 * Server Action, un Route Handler o un test sin cambios.
 *
 * PUNTO DE EXTENSIÓN: por ahora solo registra el mensaje en el servidor.
 * Reemplaza el cuerpo para guardarlo en la base de datos o enviarlo por email
 * (ver docs/EXTRAS.md si seleccionaste Resend).
 */
export async function processContactMessage(input: ContactInput): Promise<void> {
  console.info(`[contacto] mensaje de ${input.email} (${input.message.length} caracteres)`);
}
