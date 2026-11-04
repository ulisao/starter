"use client";

import Link from "next/link";
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
<%#if authPassword%>
import { useRouter } from "next/navigation";
<%#endif%>
<%#if authOtp%>
import { useRouter } from "next/navigation";
<%#endif%>
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { emailSchema, firstError } from "../schemas/auth-schema";
<%#if authPassword%>
import { nameSchema, passwordSchema } from "../schemas/auth-schema";
<%#endif%>
<%#if authOtp%>
import { otpSchema } from "../schemas/auth-schema";
<%#endif%>

// Formulario de autenticación (login y registro). Método elegido: <%= authMethodLabel %>.
//
// Es un Client Component porque llama a `authClient` desde el navegador. Valida con Zod
// solo para dar mensajes rápidos: la validación que cuenta ocurre en el servidor.
// Tras iniciar sesión se redirige a /dashboard; cambia DESTINATION para usar otra ruta.
const DESTINATION = "/dashboard";
const GENERIC_ERROR = "No se pudo completar la operación. Inténtalo de nuevo.";

type Mode = "login" | "register";

function Field({ id, label, ...props }: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input id={id} name={id} className="h-10 w-full rounded-md border border-border bg-background px-3" {...props} />
    </div>
  );
}

function Message({ error, children }: { error?: string | null; children?: ReactNode }) {
  if (error) return <p role="alert" className="text-sm text-danger">{error}</p>;
  return children ? <p role="status" className="text-sm">{children}</p> : null;
}

/** Lee un campo de texto de un formulario sin asumir que existe. */
const field = (data: FormData, name: string) => String(data.get(name) ?? "");
<%#if authPassword%>

function PasswordForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const [name, email, password] = [field(data, "name"), field(data, "email"), field(data, "password")];
    const invalid =
      (mode === "register" ? firstError(nameSchema, name) : null) ?? firstError(emailSchema, email) ?? firstError(passwordSchema, password);
    if (invalid) return setError(invalid);

    setError(null);
    setPending(true);
    const result =
      mode === "register"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) return setError(result.error.message ?? GENERIC_ERROR);
    router.push(DESTINATION);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {mode === "register" && <Field id="name" label="Nombre" autoComplete="name" />}
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Field id="password" label="Contraseña" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} />
      <Message error={error} />
      <Button type="submit" disabled={pending} className="w-full">
        {mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
<%#endif%>
<%#if authGoogle%>

function GoogleButton() {
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    // Redirige a Google; al volver, Better Auth crea la sesión y envía al usuario a DESTINATION.
    const result = await authClient.signIn.social({ provider: "google", callbackURL: DESTINATION });
    if (result.error) setError(result.error.message ?? GENERIC_ERROR);
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={onClick} className="w-full">
        Continuar con Google
      </Button>
      <Message error={error} />
    </div>
  );
}
<%#endif%>
<%#if authMagicLink%>

function MagicLinkForm() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = field(new FormData(event.currentTarget), "email");
    const invalid = firstError(emailSchema, email);
    if (invalid) return setError(invalid);

    setError(null);
    setPending(true);
    const result = await authClient.signIn.magicLink({ email, callbackURL: DESTINATION });
    setPending(false);
    if (result.error) return setError(result.error.message ?? GENERIC_ERROR);
    setSentTo(email);
  }

  if (sentTo) return <Message>Te enviamos un enlace a {sentTo}. Ábrelo para iniciar sesión (expira en 5 minutos).</Message>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Message error={error} />
      <Button type="submit" disabled={pending} className="w-full">
        Enviar enlace de acceso
      </Button>
    </form>
  );
}
<%#endif%>
<%#if authOtp%>

function OtpForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = field(new FormData(event.currentTarget), "email");
    const invalid = firstError(emailSchema, value);
    if (invalid) return setError(invalid);

    setError(null);
    setPending(true);
    const result = await authClient.emailOtp.sendVerificationOtp({ email: value, type: "sign-in" });
    setPending(false);
    if (result.error) return setError(result.error.message ?? GENERIC_ERROR);
    setEmail(value);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otp = field(new FormData(event.currentTarget), "otp");
    const invalid = firstError(otpSchema, otp);
    if (invalid || !email) return setError(invalid);

    setError(null);
    setPending(true);
    const result = await authClient.signIn.emailOtp({ email, otp });
    setPending(false);
    if (result.error) return setError(result.error.message ?? GENERIC_ERROR);
    router.push(DESTINATION);
    router.refresh();
  }

  if (!email) {
    return (
      <form onSubmit={sendCode} className="space-y-4" noValidate>
        <Field id="email" label="Email" type="email" autoComplete="email" />
        <Message error={error} />
        <Button type="submit" disabled={pending} className="w-full">
          Enviar código
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-4" noValidate>
      <Message>Enviamos un código de 6 dígitos a {email}.</Message>
      <Field id="otp" label="Código" inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
      <Message error={error} />
      <Button type="submit" disabled={pending} className="w-full">
        Verificar e iniciar sesión
      </Button>
    </form>
  );
}
<%#endif%>

export function AuthForm({ mode }: { mode: Mode }) {
  const isLogin = mode === "login";
  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{isLogin ? "Iniciar sesión" : "Crear cuenta"}</h1>
<%#if !authPassword%>
      {!isLogin && <p className="text-sm text-muted">No necesitas registrarte aparte: tu cuenta se crea la primera vez que inicias sesión.</p>}
<%#endif%>
<%#if authPassword%>
      <PasswordForm mode={mode} />
<%#endif%>
<%#if authPassword%>
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
      <p className="text-sm text-muted">
        {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link href={isLogin ? "/register" : "/login"} className="underline">
          {isLogin ? "Crear cuenta" : "Iniciar sesión"}
        </Link>
      </p>
    </div>
  );
}
