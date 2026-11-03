import "server-only";
import { Invoice, PreApproval, PreApprovalPlan } from "mercadopago";
import { AppError } from "@/lib/errors";
import { getPrisma } from "@/lib/database/prisma";
import { getAppUrl, getMercadoPagoConfig } from "@/lib/payments/mercadopago";
import { getPlan } from "./catalog";
import { onSubscriptionChanged } from "./hooks";
import { applyPaymentState } from "./transactions";

type SubscriptionStatusValue = "PENDING" | "AUTHORIZED" | "PAUSED" | "CANCELLED";

/** Traduce el estado de un preapproval de Mercado Pago. Lo desconocido se trata como PENDING. */
function mapSubscriptionStatus(mpStatus: string | undefined): SubscriptionStatusValue {
  switch (mpStatus) {
    case "authorized":
      return "AUTHORIZED";
    case "paused":
      return "PAUSED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

type CreateSubscriptionInput = {
  planId: string;
  payerEmail: string;
  /** UUID generado por el cliente por intento de suscripción; hace idempotente la creación. */
  idempotencyKey: string;
  /** Usuario autenticado (o null). Lo determina el servidor, nunca el cliente. */
  userId: string | null;
};

/**
 * Crea (o recupera) una suscripción a un plan del catálogo.
 *
 * Una suscripción NO es un pago único repetido: se crea un `preapproval` que Mercado
 * Pago cobra periódicamente. Se crea en estado `pending` SIN tarjeta; el comprador la
 * autoriza en `init_point` y recién entonces pasa a `authorized` (lo informa el webhook).
 * Monto y frecuencia salen de `catalog.ts` (servidor), nunca del cliente.
 */
export async function createSubscription({ planId, payerEmail, idempotencyKey, userId }: CreateSubscriptionInput): Promise<{ checkoutUrl: string }> {
  const plan = getPlan(planId);
  if (!plan) throw new AppError("El plan no existe.", 400, "invalid_plan");

  const prisma = getPrisma();
  let sub = await prisma.paymentSubscription.findUnique({ where: { idempotencyKey } });
  if (sub && (sub.userId !== userId || sub.planId !== planId || sub.payerEmail !== payerEmail)) {
    throw new AppError("La clave de idempotencia ya se usó en otra suscripción.", 409, "idempotency_conflict");
  }
  if (sub?.checkoutUrl) return { checkoutUrl: sub.checkoutUrl };

  sub ??= await prisma.paymentSubscription.create({
    data: { userId, idempotencyKey, planId, payerEmail, amount: plan.amount, currency: plan.currency },
  });

  const preapproval = await new PreApproval(getMercadoPagoConfig()).create({
    body: {
      reason: plan.title,
      external_reference: sub.id,
      payer_email: payerEmail,
      status: "pending",
      // Página informativa a la que vuelve el comprador. No autoriza ni aprueba nada.
      back_url: `${getAppUrl()}/payments/subscription`,
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequencyType,
        transaction_amount: plan.amount,
        currency_id: plan.currency,
      },
    },
    requestOptions: { idempotencyKey: sub.id },
  });

  if (!preapproval.id || !preapproval.init_point) throw new Error("Mercado Pago no devolvió una URL de suscripción.");
  await prisma.paymentSubscription.update({
    where: { id: sub.id },
    data: { mpPreapprovalId: preapproval.id, checkoutUrl: preapproval.init_point },
  });
  return { checkoutUrl: preapproval.init_point };
}

/**
 * Sincroniza una suscripción: consulta su estado REAL a Mercado Pago y lo aplica.
 * Idempotente: `onSubscriptionChanged` se ejecuta una sola vez por cambio de estado.
 */
export async function syncPreapproval(preapprovalId: string): Promise<void> {
  const preapproval = await new PreApproval(getMercadoPagoConfig()).get({ id: preapprovalId });
  if (!preapproval.external_reference) return;

  const prisma = getPrisma();
  const sub = await prisma.paymentSubscription.findUnique({ where: { id: preapproval.external_reference } });
  if (!sub) return;

  // Defensa en profundidad: lo que se cobra debe coincidir con lo que fijó el servidor.
  const charged = preapproval.auto_recurring?.transaction_amount;
  if (charged !== undefined && Number(charged) !== Number(sub.amount)) {
    console.error("[pagos] el monto de la suscripción no coincide con el registrado", sub.id, preapprovalId);
    return;
  }

  const status = mapSubscriptionStatus(preapproval.status);
  const changed = await prisma.paymentSubscription.updateMany({
    where: { id: sub.id, status: { not: status } },
    data: {
      status,
      mpPreapprovalId: preapproval.id ?? preapprovalId,
      nextPaymentDate: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : null,
    },
  });
  if (changed.count === 1) {
    await onSubscriptionChanged({ subscriptionId: sub.id, userId: sub.userId, planId: sub.planId, status });
  }
}

/**
 * Registra un cobro periódico (renovación) a partir de la notificación
 * `subscription_authorized_payment`. Un cobro rechazado queda como REJECTED y el estado
 * de la suscripción puede cambiar (Mercado Pago reintenta y puede pausarla o cancelarla),
 * por eso se vuelve a sincronizar el preapproval al final.
 */
export async function recordAuthorizedPayment(invoiceId: string): Promise<void> {
  const invoice = await new Invoice(getMercadoPagoConfig()).get({ id: invoiceId });
  if (!invoice.preapproval_id) return;

  const prisma = getPrisma();
  const sub = await prisma.paymentSubscription.findUnique({ where: { mpPreapprovalId: invoice.preapproval_id } });
  if (!sub) return;

  // Mientras el cobro no tenga un pago asociado (programado, en reintento) no hay nada que registrar.
  if (invoice.payment?.id) {
    const mpPaymentId = String(invoice.payment.id);
    const findTransaction = () => prisma.paymentTransaction.findUnique({ where: { mpPaymentId } });
    let tx = await findTransaction();
    if (!tx) {
      try {
        tx = await prisma.paymentTransaction.create({
          data: {
            userId: sub.userId,
            productId: sub.planId,
            title: invoice.reason ?? sub.planId,
            amount: invoice.transaction_amount ?? sub.amount,
            currency: invoice.currency_id ?? sub.currency,
            mpPaymentId,
            mpPreapprovalId: invoice.preapproval_id,
          },
        });
      } catch {
        // Otra entrega de la misma notificación la creó primero (clave única mpPaymentId).
        tx = await findTransaction();
      }
    }
    if (tx) await applyPaymentState(tx, { mpPaymentId, status: invoice.payment.status, statusDetail: invoice.payment.status_detail });
  }

  await syncPreapproval(invoice.preapproval_id);
}

/**
 * Cancela una suscripción. Solo su dueño puede hacerlo: las suscripciones creadas sin
 * usuario (proyecto sin autenticación) no son cancelables desde la API; hazlo desde el
 * panel de Mercado Pago o implementa tu propia autorización.
 */
export async function cancelSubscription(id: string, userId: string | null): Promise<void> {
  const sub = await getPrisma().paymentSubscription.findUnique({ where: { id } });
  // Misma respuesta para "no existe" y "no es tuya": no revela qué ids existen.
  if (!sub || !userId || sub.userId !== userId || !sub.mpPreapprovalId) {
    throw new AppError("La suscripción no existe.", 404, "subscription_not_found");
  }
  await new PreApproval(getMercadoPagoConfig()).update({ id: sub.mpPreapprovalId, body: { status: "cancelled" } });
  // El estado local se actualiza con el estado real que informa Mercado Pago.
  await syncPreapproval(sub.mpPreapprovalId);
}

/**
 * OPCIONAL: crea en Mercado Pago un PLAN de suscripción reutilizable a partir del
 * catálogo y devuelve su `init_point`, un enlace que puedes compartir (email, redes).
 * El flujo principal de esta plantilla NO lo necesita: cada suscripción se crea con su
 * propio preapproval. Úsalo desde un script o una acción de administración si prefieres
 * vender por enlace de plan.
 */
export async function createSubscriptionPlan(planId: string): Promise<{ planId: string; initPoint: string }> {
  const plan = getPlan(planId);
  if (!plan) throw new AppError("El plan no existe.", 400, "invalid_plan");
  const created = await new PreApprovalPlan(getMercadoPagoConfig()).create({
    body: {
      reason: plan.title,
      back_url: `${getAppUrl()}/payments/subscription`,
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequencyType,
        transaction_amount: plan.amount,
        currency_id: plan.currency,
      },
    },
    requestOptions: { idempotencyKey: `plan-${planId}-${plan.amount}-${plan.frequency}${plan.frequencyType}` },
  });
  if (!created.id || !created.init_point) throw new Error("Mercado Pago no devolvió el plan.");
  return { planId: created.id, initPoint: created.init_point };
}
