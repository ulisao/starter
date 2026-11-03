import { z } from "zod";
import { emailSchema } from "./email-schema";

// Al iniciar sesión no se impone la política de contraseñas (solo que no esté vacía):
// así cuentas antiguas con otra política pueden seguir entrando.
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
});

// Al registrarse sí. 72 es el máximo de bytes que usa bcrypt (el algoritmo de Supabase);
// aceptar más sería engañoso. El mínimo real lo define Authentication → Sign In / Providers
// en el dashboard de Supabase; mantén ambos alineados.
export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña no puede superar 72 caracteres."),
});
