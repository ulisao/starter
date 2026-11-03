import "server-only";
import { Payment } from "mercadopago";
import type { PaymentTransaction } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/database/prisma";
import { getMercadoPagoConfig } from "@/lib/payments/mercadopago";
import { onPaymentApproved } from "./hooks";

export type PaymentStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "REFUNDED";

/**
 * Traduce el estado de Mercado Pago al de nuestra base de datos.
 * Los estados desconocidos se tratan como PENDING (nunca como aprobado).
 */
export function mapPaymentStatus(mpStatus: string | undefined): PaymentStatusValue {
  switch (mpStatus) {
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      // pending, in_process, authorized, in_mediation...
      return "PENDING";
  }
}

/**
 * Aplica a una transacción el estado REAL de un pago de Mercado Pago.
 *
 * Es idempotente: el `updateMany` condicional solo cambia la fila si el estado es
 * distinto, así que una notificación repetida (o dos en paralelo) produce una única
 * transición y `onPaymentApproved` se ejecuta una sola vez por aprobación.
 */
export async function applyPaymentState(
  tx: PaymentTransaction,
  payment: { mpPaymentId: string; status: string | undefined; statusDetail?: string },
): Promise<void> {
  // Un intento anterior (por ejemplo rechazado) puede notificarse DESPUÉS de uno aprobado.
  // Una vez aprobada, la transacción solo la modifica el mismo pago (por ejemplo un reembolso).
  if (tx.status === "APPROVED" && tx.mpPaymentId && tx.mpPaymentId !== payment.mpPaymentId) {
    console.error("[pagos] se ignoró un pago adicional sobre una transacción ya aprobada", tx.id, payment.mpPaymentId);
    return;
  }

  const status = mapPaymentStatus(payment.status);
  const changed = await getPrisma().paymentTransaction.updateMany({
    where: { id: tx.id, status: { not: status } },
    data: { status, statusDetail: payment.statusDetail ?? null, mpPaymentId: payment.mpPaymentId },
  });

  if (changed.count === 1 && status === "APPROVED") {
    await onPaymentApproved({
      transactionId: tx.id,
      userId: tx.userId,
      productId: tx.productId,
      amount: Number(tx.amount),
      currency: tx.currency,
    });
  }
}

/**
 * Sincroniza un pago concreto: consulta su estado a la API de Mercado Pago (la única
 * fuente de verdad) y lo aplica a la transacción que lo originó.
 *
 * El `paymentId` proviene de una notificación con firma válida, pero aun así el
 * contenido del pago se lee desde la API, nunca desde el cuerpo de la notificación.
 */
export async function syncPayment(paymentId: string): Promise<void> {
  const payment = await new Payment(getMercadoPagoConfig()).get({ id: paymentId });

  // `external_reference` es el id de nuestra fila. Si no existe, el pago no es nuestro
  // (o es un cobro de suscripción, que se registra desde su propia notificación).
  const reference = payment.external_reference;
  if (!reference) return;
  const tx = await getPrisma().paymentTransaction.findUnique({ where: { id: reference } });
  if (!tx) return;

  // Defensa en profundidad: el monto y la moneda cobrados deben ser los que fijó el servidor.
  if (Number(payment.transaction_amount) !== Number(tx.amount) || payment.currency_id !== tx.currency) {
    console.error("[pagos] el monto o la moneda del pago no coinciden con la transacción", tx.id, paymentId);
    return;
  }

  await applyPaymentState(tx, { mpPaymentId: String(payment.id ?? paymentId), status: payment.status, statusDetail: payment.status_detail });
}
