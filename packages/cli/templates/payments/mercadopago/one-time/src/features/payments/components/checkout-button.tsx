"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CheckoutButtonProps = { productId: string; label?: string };

// Client Component: necesita estado y fetch. Envía SOLO el id del producto; el precio lo
// decide el servidor (src/services/payments/catalog.ts). El UUID identifica este intento
// de compra: si el usuario hace doble clic o reintenta, el servidor devuelve el mismo
// checkout en lugar de crear otro cobro.
export function CheckoutButton({ productId, label = "Pagar con Mercado Pago" }: CheckoutButtonProps) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, idempotencyKey }),
      });
      const data = (await response.json()) as { checkoutUrl?: string };
      if (!response.ok || !data.checkoutUrl) throw new Error("checkout_failed");
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("No se pudo iniciar el pago. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={startCheckout} disabled={pending}>
        {pending ? "Redirigiendo..." : label}
      </Button>
      <p role="status" className="text-sm text-danger">
        {error}
      </p>
    </div>
  );
}
