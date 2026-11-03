"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type SubscribeFormProps = { planId: string };

// Client Component: necesita estado y fetch. Envía el id del plan y el email del comprador;
// el monto lo decide el servidor (src/services/payments/catalog.ts). El UUID identifica este
// intento: un doble clic devuelve la misma suscripción en lugar de crear otra.
export function SubscribeForm({ planId }: SubscribeFormProps) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payerEmail = String(new FormData(event.currentTarget).get("email") ?? "");
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/payments/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, payerEmail, idempotencyKey }),
      });
      const data = (await response.json()) as { checkoutUrl?: string };
      if (!response.ok || !data.checkoutUrl) throw new Error("subscription_failed");
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("No se pudo iniciar la suscripción. Revisa el email e inténtalo de nuevo.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <label htmlFor={`email-${planId}`} className="text-sm font-medium">
        Email de tu cuenta de Mercado Pago
      </label>
      <input
        id={`email-${planId}`}
        name="email"
        type="email"
        required
        className="h-10 w-full rounded-md border border-border bg-background px-3"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Redirigiendo..." : "Suscribirme"}
      </Button>
      <p role="status" className="text-sm text-danger">
        {error}
      </p>
    </form>
  );
}
