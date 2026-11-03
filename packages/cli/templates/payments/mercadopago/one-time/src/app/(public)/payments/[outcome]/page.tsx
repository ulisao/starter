import Link from "next/link";
import { notFound } from "next/navigation";

// Páginas a las que Mercado Pago devuelve al comprador (back_urls). SOLO INFORMAN:
// que el navegador llegue a /payments/success no prueba que el pago esté aprobado
// (la URL puede abrirla cualquiera). La aprobación real la registra el webhook
// verificado en la tabla payment_transactions.
const OUTCOMES = {
  success: {
    title: "Recibimos tu pago",
    text: "Estamos confirmando el pago con Mercado Pago. Cuando se apruebe, tu compra se habilitará; puede tardar unos minutos.",
  },
  pending: {
    title: "Tu pago está pendiente",
    text: "Mercado Pago aún no acreditó el pago (por ejemplo, si elegiste efectivo o transferencia). Te avisaremos cuando se confirme.",
  },
  failure: {
    title: "No se completó el pago",
    text: "El pago fue rechazado o cancelado y no se realizó ningún cobro. Puedes intentarlo de nuevo.",
  },
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(OUTCOMES).map((outcome) => ({ outcome }));
}

export default async function PaymentOutcomePage({ params }: { params: Promise<{ outcome: string }> }) {
  const { outcome } = await params;
  if (!Object.hasOwn(OUTCOMES, outcome)) notFound();
  const { title, text } = OUTCOMES[outcome as keyof typeof OUTCOMES];

  return (
    <section className="max-w-prose space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted">{text}</p>
      <Link href="/payments" className="text-sm underline">
        Volver
      </Link>
    </section>
  );
}
