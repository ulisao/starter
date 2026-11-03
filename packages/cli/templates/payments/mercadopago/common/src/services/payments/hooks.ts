import "server-only";

/**
 * Reglas de negocio que se ejecutan cuando cambia el estado de un cobro.
 *
 * Este es el ÚNICO lugar que decide qué ocurre al aprobarse un pago. Lo invoca el
 * webhook ya verificado, una sola vez por transición (las notificaciones repetidas
 * no vuelven a llamarlo), pero escribe aquí lógica idempotente igualmente: si tu
 * proceso falla a mitad, Mercado Pago reintentará la notificación.
 *
 * TODO (decisión de negocio): implementa lo que corresponda a tu producto, por
 * ejemplo habilitar el acceso, enviar un recibo por email, descontar stock o
 * registrar el pedido. Mientras tanto solo se escribe un log.
 */
export type ApprovedPayment = {
  transactionId: string;
  userId: string | null;
  productId: string;
  amount: number;
  currency: string;
};

export async function onPaymentApproved(payment: ApprovedPayment): Promise<void> {
  console.info("[pagos] pago aprobado", payment.transactionId, payment.productId);
}
<%#if paySubscription%>

export type SubscriptionChange = {
  subscriptionId: string;
  userId: string | null;
  planId: string;
  /** PENDING | AUTHORIZED | PAUSED | CANCELLED */
  status: string;
};

/**
 * Se llama cuando el estado de una suscripción cambia (autorizada, pausada, cancelada).
 * TODO (decisión de negocio): activa o revoca el acceso del usuario según `status`.
 */
export async function onSubscriptionChanged(change: SubscriptionChange): Promise<void> {
  console.info("[pagos] suscripción", change.subscriptionId, "->", change.status);
}
<%#endif%>
