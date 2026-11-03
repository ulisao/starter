"use client";

import { useState } from "react";
<%#if !authGoogle%>
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthField as Field } from "./auth-field";
<%#else%>
<%#if authPassword%>
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthField as Field } from "./auth-field";
<%#endif%>
<%#endif%>
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { AuthFeedback as Feedback } from "./auth-field";

// Formulario de acceso. Método configurado: <%= authMethodLabel %>.
//
// Es Client Component porque `signIn` se ejecuta en el navegador y habla con Convex Auth. El primer
// argumento de `signIn` es el `id` del proveedor definido en convex/auth.ts ("password", "google",
// "magic-link" u "otp"). DESTINATION es la ruta a la que se vuelve tras iniciar sesión.
const DESTINATION = "/dashboard";
<%#if authPassword%>

function PasswordForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn("password", new FormData(event.currentTarget));
      router.push(DESTINATION);
    } catch {
      setError(flow === "signIn" ? "Email o contraseña incorrectos." : "No se pudo crear la cuenta. Revisa los datos (contraseña de al menos 8 caracteres).");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Contraseña" name="password" type="password" autoComplete={flow === "signIn" ? "current-password" : "new-password"} />
      <input type="hidden" name="flow" value={flow} />
      <Feedback error={error} />
      <Button type="submit" disabled={pending} className="w-full">
        {flow === "signIn" ? "Entrar" : "Crear cuenta"}
      </Button>
      <button type="button" className="text-sm underline" onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}>
        {flow === "signIn" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </form>
  );
}
<%#endif%>
<%#if authGoogle%>

function GoogleButton() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          setError(null);
          // Inicia el flujo OAuth: el navegador viaja a Google y vuelve a DESTINATION.
          signIn("google", { redirectTo: DESTINATION }).catch(() => setError("No se pudo iniciar con Google."));
        }}
      >
        Continuar con Google
      </Button>
      <Feedback error={error} />
    </div>
  );
}
<%#endif%>
<%#if authMagicLink%>

function MagicLinkForm() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("redirectTo", DESTINATION);
      await signIn("magic-link", formData);
      setSent(true);
    } catch {
      setError("No pudimos enviar el enlace. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  if (sent) return <p className="text-sm">Si el email es válido, te enviamos un enlace de acceso. Revisa tu bandeja de entrada.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Feedback error={error} />
      <Button type="submit" disabled={pending} className="w-full">
        Enviar enlace de acceso
      </Button>
    </form>
  );
}
<%#endif%>
<%#if authOtp%>

function OtpForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await signIn("otp", formData);
      if (email === null) setEmail(String(formData.get("email")));
      else router.push(DESTINATION);
    } catch {
      setError(email === null ? "No pudimos enviar el código. Inténtalo de nuevo." : "Código incorrecto o vencido.");
    } finally {
      setPending(false);
    }
  }

  // Paso 2: el código viaja junto al mismo email con el que se pidió (Convex Auth lo exige).
  if (email !== null) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <Field label="Código de 8 dígitos" name="code" autoComplete="one-time-code" inputMode="numeric" />
        <Feedback error={error} info={`Enviamos un código a ${email}.`} />
        <Button type="submit" disabled={pending} className="w-full">
          Verificar código
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Feedback error={error} />
      <Button type="submit" disabled={pending} className="w-full">
        Enviar código
      </Button>
    </form>
  );
}
<%#endif%>

export function SignInForm() {
  return (
    <div className="space-y-6">
<%#if authPassword%>
      <PasswordForm />
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
    </div>
  );
}
