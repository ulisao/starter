import Link from "next/link";

// Página a la que Mercado Pago devuelve al comprador tras el flujo de autorización
// (back_url). SOLO INFORMA: llegar aquí no prueba que la suscripción esté autorizada
// (la URL puede abrirla cualquiera). El estado real lo registra el webhook verificado
// en la tabla payment_subscriptions.
export default function SubscriptionReturnPage() {
  return (
    <section className="max-w-prose space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Estamos procesando tu suscripción</h1>
      <p className="text-muted">
        Mercado Pago nos informará cuando quede autorizada; puede tardar unos minutos. Si cancelaste o hubo un
        problema, puedes intentarlo de nuevo.
      </p>
      <Link href="/payments" className="text-sm underline">
        Volver
      </Link>
    </section>
  );
}
