import { convexAuth } from "@convex-dev/auth/server";
<%#if authPassword%>
import { Password } from "@convex-dev/auth/providers/Password";
<%#endif%>
<%#if authGoogle%>
import Google from "@auth/core/providers/google";
<%#endif%>
<%#if authMagicLink%>
import { Email } from "@convex-dev/auth/providers/Email";
<%#endif%>
<%#if authOtp%>
import { Email } from "@convex-dev/auth/providers/Email";
<%#endif%>

// Configuración de Convex Auth (se ejecuta DENTRO de Convex, no en Next.js).
//
// Cada elemento de `providers` es un método de acceso. El primer argumento de `signIn("id", ...)`
// en el navegador es el `id` del proveedor ("password", "google", "magic-link" u "otp").
// Los secretos de este archivo se leen de las variables del DEPLOYMENT de Convex
// (`npx convex env set NOMBRE valor`), no de .env.local. Ver docs/AUTHENTICATION.md.
<%#if authMagicLink%>

<%#if hasResend%>
// Envío de email con la API REST de Resend. Se usa `fetch` (y no `src/lib/email/send.ts`) porque
// este código corre en Convex, que no puede importar el código de Next.js ni ve tu .env.local.
// Requiere las variables AUTH_RESEND_KEY y AUTH_EMAIL_FROM en el deployment de Convex.
async function sendAuthEmail(to: string, subject: string, text: string) {
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
// SIN proveedor de email configurado: el enlace solo se imprime en los logs de Convex (terminal de
// `convex dev` o pestaña Logs del Dashboard). Sirve para desarrollar; en producción reemplaza el
// cuerpo por el envío con tu proveedor (por ejemplo Resend: vuelve a generar el proyecto con ese extra).
async function sendAuthEmail(to: string, subject: string, text: string) {
  console.log(`[auth] Email para ${to} | ${subject}\n${text}`);
}
<%#endif%>

// Enlace mágico: al abrirlo se inicia sesión sin contraseña. `authorize: undefined` desactiva la
// comprobación de que el email coincida, porque el enlace ya prueba el acceso a la bandeja.
// Caduca a los 15 minutos. Los escáneres de correo corporativos pueden "abrir" el enlace antes que el
// usuario y consumirlo; si lo notas, cambia a OTP.
const MagicLink = Email({
  id: "magic-link",
  maxAge: 60 * 15,
  authorize: undefined,
  async sendVerificationRequest({ identifier: email, url }) {
    await sendAuthEmail(email, "Tu enlace de acceso", `Abre este enlace para iniciar sesión (caduca en 15 minutos):\n${url}`);
  },
});
<%#endif%>
<%#if authOtp%>

<%#if hasResend%>
// Envío de email con la API REST de Resend. Se usa `fetch` (y no `src/lib/email/send.ts`) porque
// este código corre en Convex, que no puede importar el código de Next.js ni ve tu .env.local.
// Requiere las variables AUTH_RESEND_KEY y AUTH_EMAIL_FROM en el deployment de Convex.
async function sendAuthEmail(to: string, subject: string, text: string) {
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
// SIN proveedor de email configurado: el código solo se imprime en los logs de Convex (terminal de
// `convex dev` o pestaña Logs del Dashboard). Sirve para desarrollar; en producción reemplaza el
// cuerpo por el envío con tu proveedor (por ejemplo Resend: vuelve a generar el proyecto con ese extra).
async function sendAuthEmail(to: string, subject: string, text: string) {
  console.log(`[auth] Email para ${to} | ${subject}\n${text}`);
}
<%#endif%>

// Código de un solo uso de 8 dígitos. Se genera con crypto.getRandomValues y se descartan los valores
// que sesgarían el reparto (rejection sampling). Caduca a los 10 minutos. Aquí NO se desactiva
// `authorize`: por defecto el código solo vale junto con el mismo email con el que se pidió.
function randomCode(length: number) {
  const limit = 4294967296 - (4294967296 % 10);
  let code = "";
  while (code.length < length) {
    const [n] = crypto.getRandomValues(new Uint32Array(1));
    if (n < limit) code += String(n % 10);
  }
  return code;
}

const OTP = Email({
  id: "otp",
  maxAge: 60 * 10,
  async generateVerificationToken() {
    return randomCode(8);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendAuthEmail(email, "Tu código de acceso", `Tu código para iniciar sesión es ${token} (caduca en 10 minutos).`);
  },
});
<%#endif%>

// Exporta lo que Convex Auth necesita (`auth` lo usa convex/http.ts; el resto son funciones que
// llama el cliente). No cambies estos nombres.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
<%#if authPassword%>
    // Email + contraseña. Mínimo 8 caracteres (regla por defecto de la librería). Para exigir
    // verificación de email o recuperación de contraseña agrega `verify` / `reset` (ver docs/AUTHENTICATION.md).
    Password,
<%#endif%>
<%#if authGoogle%>
    // Google OAuth: lee AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET del deployment de Convex.
    Google,
<%#endif%>
<%#if authMagicLink%>
    MagicLink,
<%#endif%>
<%#if authOtp%>
    OTP,
<%#endif%>
  ],
});
