import { CheckoutButton } from "@/features/payments";
import { PRODUCTS } from "@/services/payments/catalog";

// Página de ejemplo de pago único. Reemplázala por tu tienda o página de precios real.
// Los productos se leen del catálogo del servidor; el botón solo envía el id.
export default function PaymentsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Pagos</h1>
      <ul className="space-y-4">
        {Object.entries(PRODUCTS).map(([id, product]) => (
          <li key={id} className="space-y-2 rounded-md border border-border p-4">
            <p className="font-medium">{product.title}</p>
            <p className="text-sm text-muted">
              {product.unitPrice} {product.currency}
            </p>
            <CheckoutButton productId={id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
