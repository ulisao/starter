import { z } from "zod";

// Validación en el navegador para dar mensajes claros antes de llamar al servidor.
// No sustituye la validación del servidor: Better Auth valida de nuevo cada petición.
export const emailSchema = z.email("Ingresa un email válido.");
export const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.");
export const nameSchema = z.string().trim().min(1, "Ingresa tu nombre.");
export const otpSchema = z.string().regex(/^\d{6}$/, "El código tiene 6 dígitos.");

/** Devuelve el primer mensaje de error de un esquema, o null si el valor es válido. */
export function firstError(schema: z.ZodType, value: unknown): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Valor inválido.");
}
