import { z } from "zod";

// Esquema de validación del formulario de contacto.
//
// REGLA DEL PROYECTO: todo dato que llega del exterior (formularios, query
// params, cuerpos de request, webhooks) se valida con Zod en el servidor antes
// de usarse. Este esquema se reutiliza en el cliente solo para mostrar errores;
// la validación que cuenta es siempre la del servidor.
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre."),
  email: z.email("Ingresa un email válido."),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres.").max(2000, "El mensaje es demasiado largo."),
});

export type ContactInput = z.infer<typeof contactSchema>;
