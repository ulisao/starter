import { z } from "zod";
import { emailSchema } from "./email-schema";

// Supabase permite códigos de 6 a 10 dígitos (Authentication → Sign In / Providers → Email).
export const otpVerifySchema = z.object({
  email: emailSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{6,10}$/, "El código solo tiene dígitos (entre 6 y 10)."),
});
