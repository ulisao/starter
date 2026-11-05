import { fetchMutation } from "convex/nextjs";
import type { ContactInput } from "@/features/contact/schemas/contact-schema";
import { api } from "../../convex/_generated/api";

/**
 * Lógica de negocio del formulario de contacto (Convex).
 *
 * Guarda el mensaje en la tabla `contactMessages` llamando a la mutation pública
 * `contactMessages.create` desde el servidor; `fetchMutation` lee NEXT_PUBLIC_CONVEX_URL.
 * Los datos llegan validados con Zod desde la Server Action, y la mutation los vuelve a validar
 * porque cualquiera puede llamarla directamente.
 *
 * PUNTO DE EXTENSIÓN: aquí también puedes notificar por email (ver docs/EXTRAS.md si elegiste Resend).
 */
export async function processContactMessage(input: ContactInput): Promise<void> {
  await fetchMutation(api.contactMessages.create, input);
}
