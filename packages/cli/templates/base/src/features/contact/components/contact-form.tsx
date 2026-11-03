"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitContact, type ContactState } from "../actions";

const initialState: ContactState = { ok: false, message: "" };

// Client Component: necesita "use client" porque usa un hook de estado (useActionState).
// Es el patrón a seguir: la lógica vive en la Server Action y el componente solo
// muestra el estado que esta devuelve.
export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4" noValidate>
      {(["name", "email"] as const).map((field) => (
        <div key={field} className="space-y-1">
          <label htmlFor={field} className="text-sm font-medium">
            {field === "name" ? "Nombre" : "Email"}
          </label>
          <input
            id={field}
            name={field}
            type={field === "email" ? "email" : "text"}
            className="h-10 w-full rounded-md border border-border bg-background px-3"
            aria-invalid={!!state.fieldErrors?.[field]}
          />
          <p className="text-sm text-danger">{state.fieldErrors?.[field]?.[0]}</p>
        </div>
      ))}
      <div className="space-y-1">
        <label htmlFor="message" className="text-sm font-medium">
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2"
          aria-invalid={!!state.fieldErrors?.message}
        />
        <p className="text-sm text-danger">{state.fieldErrors?.message?.[0]}</p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar"}
      </Button>
      <p role="status" className={state.ok ? "text-sm" : "text-sm text-danger"}>
        {state.message}
      </p>
    </form>
  );
}
