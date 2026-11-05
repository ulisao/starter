import "server-only";
import { Payment } from "mercadopago";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { requireEnv } from "@/lib/env";
import { getMercadoPagoConfig } from "@/lib/payments/mercadopago";
import { onPaymentApproved } from "./hooks";

export type PaymentStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "REFUNDED";
// La fila de transacción vive en Convex (tabla `paymentTransactions`, ver convex/payments.ts).
export type PaymentTransaction = Doc<"paymentTransactions">;

/**
 * Secreto compartido que protege las funciones de `convex/payments.ts`. Las funciones públicas
 * de Convex puede llamarlas cualquiera, así que cada una exige este valor. Defínelo con el mismo
 * contenido en `.env.local` y en el deployment (`npx convex env set CONVEX_PAYMENTS_SECRET ...`).
 */
export function paymentsSecret(): string {
  return requireEnv("CONVEX_PAYMENTS_SECRET");
}

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
 * La transición es atómica dentro de la mutation de Convex (`payments.applyState`): una mutation
 * es una transacción serializable, así que el patrón leer-comparar-escribir es seguro y una
 * notificación repetida (o dos en paralelo) produce una única transición. La mutation devuelve
 * si el cambio llevó la transacción a APPROVED, y solo entonces se ejecuta `onPaymentApproved`.
 */
export async function applyPaymentState(
  tx: PaymentTransaction,
  payment: { mpPaymentId: string; status: string | undefined; statusDetail?: string },
): Promise<void> {
  // Un intento anterior (por ejemplo rechazado) puede notificarse DESPUÉS de uno aprobado.
  // Una vez aprobada, la transacción solo la modifica el mismo pago (por ejemplo un reembolso).
  if (tx.status === "APPROVED" && tx.mpPaymentId && tx.mpPaymentId !== payment.mpPaymentId) {
    console.error("[pagos] se ignoró un pago adicional sobre una transacción ya aprobada", tx._id, payment.mpPaymentId);
    return;
  }

  const status = mapPaymentStatus(payment.status);
  const { changedToApproved } = await fetchMutation(api.payments.applyState, {
    secret: paymentsSecret(),
    id: tx._id,
    status,
    statusDetail: payment.statusDetail,
    mpPaymentId: payment.mpPaymentId,
  });

  if (changedToApproved) {
    await onPaymentApproved({
      transactionId: tx._id,
      userId: tx.userId ?? null,
      productId: tx.productId,
      amount: tx.amount,
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
  const tx = await fetchQuery(api.payments.getById, { secret: paymentsSecret(), id: reference });
  if (!tx) return;

  // Defensa en profundidad: el monto y la moneda cobrados deben ser los que fijó el servidor.
  if (Number(payment.transaction_amount) !== tx.amount || payment.currency_id !== tx.currency) {
    console.error("[pagos] el monto o la moneda del pago no coinciden con la transacción", tx._id, paymentId);
    return;
  }

  await applyPaymentState(tx, { mpPaymentId: String(payment.id ?? paymentId), status: payment.status, statusDetail: payment.status_detail });
}
