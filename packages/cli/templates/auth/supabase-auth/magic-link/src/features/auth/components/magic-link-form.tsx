"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { sendMagicLinkAction } from "../actions/magic-link";
import { initialAuthState } from "../types";
import { AuthField, AuthMessage } from "./auth-field";

export function MagicLinkForm() {
  const [state, formAction, pending] = useActionState(sendMagicLinkAction, initialAuthState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <AuthField name="email" label="Correo" type="email" autoComplete="email" error={state.fieldErrors?.email?.[0]} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviarme un enlace"}
      </Button>
      <AuthMessage ok={state.ok} message={state.message} />
    </form>
  );
}
