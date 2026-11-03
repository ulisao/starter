"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithPasswordAction, signUpWithPasswordAction } from "../actions/password";
import { initialAuthState } from "../types";
import { AuthField, AuthMessage } from "./auth-field";

// Client Component: usa useActionState. La validación y el acceso ocurren en la Server
// Action; este componente solo muestra el estado que devuelve.
export function PasswordForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [state, formAction, pending] = useActionState(
    isRegister ? signUpWithPasswordAction : signInWithPasswordAction,
    initialAuthState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <AuthField name="email" label="Correo" type="email" autoComplete="email" error={state.fieldErrors?.email?.[0]} />
      <AuthField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        error={state.fieldErrors?.password?.[0]}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Procesando..." : isRegister ? "Crear cuenta" : "Ingresar"}
      </Button>
      <AuthMessage ok={state.ok} message={state.message} />
    </form>
  );
}
