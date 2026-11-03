import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
<%#if authMagicLink%>
import { magicLink } from "better-auth/plugins";
<%#endif%>
<%#if authOtp%>
import { emailOTP } from "better-auth/plugins";
<%#endif%>
import { getPrisma } from "@/lib/database/prisma";
import { requireEnv } from "@/lib/env";
<%#if authMagicLink%>
<%#if hasResend%>
import { sendEmail } from "@/lib/email/send";
<%#endif%>
<%#else%>
<%#if authOtp%>
<%#if hasResend%>
import { sendEmail } from "@/lib/email/send";
<%#endif%>
<%#endif%>
<%#endif%>

// Configuración de Better Auth (servidor). Método elegido: <%= authMethodLabel %>.
//
// POR QUÉ UNA FUNCIÓN Y NO UNA CONSTANTE:
// la instancia se crea en el primer uso, no al importar el módulo. Así `next build`
// no exige BETTER_AUTH_SECRET ni DATABASE_URL, que solo existen en el entorno real.
//
// QUÉ PUEDES CAMBIAR:
//   - session.expiresIn: duración de la sesión en segundos (por defecto 7 días).
//   - user.additionalFields: campos propios del usuario (agrega también la columna en
//     prisma/schema/auth.prisma y crea una migración).
//   - plugins: Better Auth ofrece 2FA, organizaciones, roles... Documentación:
//     https://www.better-auth.com/docs
// `nextCookies()` debe ser SIEMPRE el último plugin: permite fijar cookies desde
// Server Actions.
<%#if authMagicLink%>

// Entrega de emails. Sin proveedor de email configurado:
//   - en desarrollo imprime el contenido en la consola del servidor;
//   - en producción FALLA, para no dejar a los usuarios esperando un correo que no llegará.
async function deliverEmail(to: string, subject: string, text: string): Promise<void> {
<%#if hasResend%>
  await sendEmail({ to, subject, text });
<%#else%>
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No hay proveedor de email configurado: agrega uno (por ejemplo el extra Resend) y llámalo en deliverEmail() de src/lib/auth/auth.ts.",
    );
  }
  console.info(`[auth] Email para ${to}\n${subject}\n${text}`);
<%#endif%>
}
<%#else%>
<%#if authOtp%>

// Entrega de emails. Sin proveedor de email configurado:
//   - en desarrollo imprime el contenido en la consola del servidor;
//   - en producción FALLA, para no dejar a los usuarios esperando un correo que no llegará.
async function deliverEmail(to: string, subject: string, text: string): Promise<void> {
<%#if hasResend%>
  await sendEmail({ to, subject, text });
<%#else%>
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No hay proveedor de email configurado: agrega uno (por ejemplo el extra Resend) y llámalo en deliverEmail() de src/lib/auth/auth.ts.",
    );
  }
  console.info(`[auth] Email para ${to}\n${subject}\n${text}`);
<%#endif%>
}
<%#endif%>
<%#endif%>

function createAuth() {
  return betterAuth({
    // Clave con la que se firman las sesiones y los tokens. Debe ser larga, aleatoria y
    // secreta. Si la cambias, todas las sesiones activas dejan de ser válidas.
    secret: requireEnv("BETTER_AUTH_SECRET"),
    // URL pública de la aplicación. Better Auth la usa para construir enlaces y callbacks.
    baseURL: requireEnv("BETTER_AUTH_URL"),
    database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
<%#if authPassword%>
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Para exigir email verificado antes de iniciar sesión pon requireEmailVerification
      // en true y configura emailVerification.sendVerificationEmail (requiere un proveedor de email).
    },
<%#endif%>
<%#if authGoogle%>
    socialProviders: {
      google: {
        clientId: requireEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      },
    },
<%#endif%>
    plugins: [
<%#if authMagicLink%>
      magicLink({
        // El enlace expira en 5 minutos (valor por defecto); ajusta con expiresIn (segundos).
        sendMagicLink: async ({ email, url }) => {
          await deliverEmail(email, "Tu enlace para iniciar sesión", `Inicia sesión con este enlace (expira en 5 minutos): ${url}`);
        },
      }),
<%#endif%>
<%#if authOtp%>
      emailOTP({
        // Código de 6 dígitos que expira en 5 minutos; ajusta con otpLength y expiresIn.
        async sendVerificationOTP({ email, otp }) {
          await deliverEmail(email, "Tu código de acceso", `Tu código para iniciar sesión es ${otp}. Expira en 5 minutos.`);
        },
      }),
<%#endif%>
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { betterAuth?: Auth };

/** Instancia única de Better Auth (singleton perezoso, resistente a recargas en desarrollo). */
export function getAuth(): Auth {
  globalForAuth.betterAuth ??= createAuth();
  return globalForAuth.betterAuth;
}
