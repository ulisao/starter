"use server";

import { z } from "zod";
import { contactSchema } from "./schemas/contact-schema";
import { processContactMessage } from "@/services/contact-service";

export type ContactState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/**
 * Server Action del formulario de contacto.
 *
 * Una Server Action es un endpoint público: cualquiera puede invocarla con datos
 * arbitrarios. Por eso SIEMPRE valida la entrada aquí, aunque el formulario ya
 * valide en el navegador. Si la acción requiere un usuario, comprueba la sesión
 * en el servidor antes de actuar (ver docs/AUTHENTICATION.md si hay autenticación).
 */
export async function submitContact(_previous: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  await processContactMessage(parsed.data);
  return { ok: true, message: "¡Gracias! Recibimos tu mensaje." };
}
