import { z } from "zod";

// Correo normalizado: sin espacios y en minúsculas, para que "Ana@x.com " y "ana@x.com"
// sean la misma cuenta. Se valida en el servidor aunque el navegador ya lo haga.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresa un correo válido.").max(254, "El correo es demasiado largo."));

export const emailOnlySchema = z.object({ email: emailSchema });
