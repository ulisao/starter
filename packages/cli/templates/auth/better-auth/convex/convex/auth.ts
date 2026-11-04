import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
<%#if authMagicLink%>
import { magicLink } from "better-auth/plugins";
<%#endif%>
<%#if authOtp%>
import { emailOTP } from "better-auth/plugins";
<%#endif%>
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

// Configuración de Better Auth (se ejecuta DENTRO de Convex, no en Next.js). Método elegido:
// <%= authMethodLabel %>.
//
// Los secretos se leen de las variables del DEPLOYMENT de Convex (`npx convex env set NOMBRE valor`),
// no de .env.local. Ver docs/AUTHENTICATION.md.
//   - SITE_URL: URL pública de la aplicación Next.js (sin barra final).
//   - BETTER_AUTH_SECRET: clave con la que Better Auth firma sesiones y tokens (la lee la librería).
<%#if authGoogle%>
//   - GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET: credenciales OAuth de Google.
<%#endif%>
<%#if authMagicLink%>
<%#if hasResend%>
//   - AUTH_RESEND_KEY y AUTH_EMAIL_FROM: Resend, para enviar los enlaces de acceso.
<%#endif%>
<%#endif%>
<%#if authOtp%>
<%#if hasResend%>
//   - AUTH_RESEND_KEY y AUTH_EMAIL_FROM: Resend, para enviar los códigos de acceso.
<%#endif%>
<%#endif%>
const siteUrl = process.env.SITE_URL;

/** Componente de Better Auth: adaptador de base de datos y utilidades (getAuthUser, registerRoutes...). */
export const authComponent = createClient<DataModel>(components.betterAuth);
<%#if authMagicLink%>

<%#if hasResend%>
// Envío de email con la API REST de Resend. Se usa `fetch` (y no `src/lib/email/send.ts`) porque
// este código corre en Convex, que no puede importar el código de Next.js ni ve tu .env.local.
async function deliverEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Configura AUTH_RESEND_KEY y AUTH_EMAIL_FROM en Convex (npx convex env set).");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Resend rechazó el email (HTTP ${response.status}).`);
}
<%#else%>
// SIN proveedor de email configurado: el contenido solo se imprime en los logs de Convex (terminal de
// `convex dev` o pestaña Logs del Dashboard). Sirve para desarrollar; en producción reemplaza el
// cuerpo por el envío con tu proveedor (por ejemplo Resend: vuelve a generar el proyecto con ese extra).
async function deliverEmail(to: string, subject: string, text: string): Promise<void> {
  console.log(`[auth] Email para ${to} | ${subject}\n${text}`);
}
<%#endif%>
<%#endif%>
<%#if authOtp%>

<%#if hasResend%>
// Envío de email con la API REST de Resend. Se usa `fetch` (y no `src/lib/email/send.ts`) porque
// este código corre en Convex, que no puede importar el código de Next.js ni ve tu .env.local.
async function deliverEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Configura AUTH_RESEND_KEY y AUTH_EMAIL_FROM en Convex (npx convex env set).");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Resend rechazó el email (HTTP ${response.status}).`);
}
<%#else%>
// SIN proveedor de email configurado: el contenido solo se imprime en los logs de Convex (terminal de
// `convex dev` o pestaña Logs del Dashboard). Sirve para desarrollar; en producción reemplaza el
// cuerpo por el envío con tu proveedor (por ejemplo Resend: vuelve a generar el proyecto con ese extra).
async function deliverEmail(to: string, subject: string, text: string): Promise<void> {
  console.log(`[auth] Email para ${to} | ${subject}\n${text}`);
}
<%#endif%>
<%#endif%>

/**
 * Crea la instancia de Better Auth para un contexto de Convex. Convex no tiene "instancia global":
 * se crea una por petición con el `ctx` de esa petición (así el adaptador accede a la base).
 */
export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
<%#if authPassword%>
    emailAndPassword: {
      enabled: true,
      // Para exigir email verificado pon requireEmailVerification en true y configura
      // emailVerification.sendVerificationEmail (requiere un proveedor de email).
      requireEmailVerification: false,
    },
<%#endif%>
<%#if authGoogle%>
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
      // Emite los tokens JWT que Convex valida (ver auth.config.ts). Debe ir en la lista de plugins.
      convex({ authConfig }),
    ],
  });

/**
 * Usuario autenticado, o null si no hay sesión. Es el patrón de AUTORIZACIÓN en Convex: la identidad
 * sale del token de sesión (no de un argumento que mande el cliente). Haz esta comprobación dentro
 * de CADA query, mutation o action que dependa del usuario.
 *
 * La usa `src/lib/auth/session.ts` desde el servidor de Next.js y puedes llamarla desde un Client
 * Component con `useQuery(api.auth.getCurrentUser)`.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    return { id: user._id as string, email: user.email, name: user.name };
  },
});
