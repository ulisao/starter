import { SubscribeForm } from "@/features/payments";
import { PLANS } from "@/services/payments/catalog";

// Página de ejemplo de suscripciones. Reemplázala por tu página de precios real.
// Los planes se leen del catálogo del servidor; el formulario solo envía el id y el email.
export default function PaymentsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Suscripciones</h1>
      <ul className="space-y-4">
        {Object.entries(PLANS).map(([id, plan]) => (
          <li key={id} className="space-y-3 rounded-md border border-border p-4">
            <p className="font-medium">{plan.title}</p>
            <p className="text-sm text-muted">
              {plan.amount} {plan.currency} cada {plan.frequency} {plan.frequencyType === "months" ? "mes(es)" : "día(s)"}
            </p>
            <SubscribeForm planId={id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
