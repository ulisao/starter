import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
<%#if authPassword%>
import { PasswordForm } from "@/features/auth";
<%#endif%>
<%#if authGoogle%>
import { GoogleButton } from "@/features/auth";
<%#endif%>
<%#if authMagicLink%>
import { MagicLinkForm } from "@/features/auth";
<%#endif%>
<%#if authOtp%>
import { OtpForm } from "@/features/auth";
<%#endif%>

export const metadata: Metadata = { title: "Ingresar" };

// Mensajes para `/login?error=...`. Los escriben /auth/callback y la acción de Google.
const ERROR_MESSAGES: Record<string, string> = {
  callback: "El enlace no es válido o ya caducó. Vuelve a intentarlo.",
  oauth: "No se pudo iniciar el acceso con el proveedor. Vuelve a intentarlo.",
};

// Página de acceso (<%= authMethodLabel %>). Es la única pantalla de autenticación:
// delega en los formularios de src/features/auth. Si ya hay sesión, va directo al panel.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ modo?: string; error?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");

  const params = await searchParams;
  const error = params.error ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.callback) : null;
<%#if authPassword%>
  const isRegister = params.modo === "registro";
<%#else%>
  const isRegister = false;
<%#endif%>

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{isRegister ? "Crear cuenta" : "Ingresar"}</h1>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
<%#if authPassword%>
      <PasswordForm mode={isRegister ? "register" : "login"} />
      <p className="text-sm text-muted">
        {isRegister ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <Link href={isRegister ? "/login" : "/login?modo=registro"} className="font-medium text-foreground underline">
          {isRegister ? "Ingresa" : "Regístrate"}
        </Link>
      </p>
<%#if authGoogle%>
      <p className="text-center text-sm text-muted">o</p>
<%#endif%>
<%#endif%>
<%#if authGoogle%>
      <GoogleButton />
<%#endif%>
<%#if authMagicLink%>
      <MagicLinkForm />
<%#endif%>
<%#if authOtp%>
      <OtpForm />
<%#endif%>
    </section>
  );
}
