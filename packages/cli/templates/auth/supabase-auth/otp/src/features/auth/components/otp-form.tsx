"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { sendOtpCodeAction, verifyOtpCodeAction } from "../actions/otp";
import { initialAuthState } from "../types";
import { AuthField, AuthMessage } from "./auth-field";

// Flujo en dos pasos: 1) pedir el código por correo, 2) escribirlo. El segundo formulario
// aparece cuando el primero responde bien y arrastra el correo en un campo oculto.
export function OtpForm() {
  const [sent, sendAction, sending] = useActionState(sendOtpCodeAction, initialAuthState);
  const [verified, verifyAction, verifying] = useActionState(verifyOtpCodeAction, initialAuthState);

  if (sent.ok && sent.email) {
    return (
      <form action={verifyAction} className="space-y-4" noValidate>
        <input type="hidden" name="email" value={sent.email} />
        <p className="text-sm text-muted">{sent.message}</p>
        <AuthField
          name="token"
          label="Código"
          inputMode="numeric"
          autoComplete="one-time-code"
          error={verified.fieldErrors?.token?.[0]}
        />
        <Button type="submit" className="w-full" disabled={verifying}>
          {verifying ? "Verificando..." : "Verificar código"}
        </Button>
        <AuthMessage ok={verified.ok} message={verified.message} />
      </form>
    );
  }

  return (
    <form action={sendAction} className="space-y-4" noValidate>
      <AuthField name="email" label="Correo" type="email" autoComplete="email" error={sent.fieldErrors?.email?.[0]} />
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "Enviando..." : "Enviarme un código"}
      </Button>
      <AuthMessage ok={sent.ok} message={sent.message} />
    </form>
  );
}
