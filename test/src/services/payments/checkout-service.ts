import "server-only";
import { Preference } from "mercadopago";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { AppError } from "@/lib/errors";
import { getAppUrl, getMercadoPagoConfig, isPublicHttps } from "@/lib/payments/mercadopago";
import { getProduct } from "./catalog";
import { paymentsSecret } from "./transactions";

type CreateCheckoutInput = {
  productId: string;
  /** UUID generado por el cliente por intento de compra; hace idempotente la creación. */
  idempotencyKey: string;
  /** Usuario autenticado (o null). Lo determina el servidor, nunca el cliente. */
  userId: string | null;
};

/**
 * Crea (o recupera) el checkout de un producto del catálogo.
 *
 * Flujo:
 *  1. Precio y título salen de `catalog.ts` (servidor), jamás del cliente.
 *  2. Se registra una transacción PENDING en Convex; su id viaja como `external_reference`.
 *  3. Se crea la preferencia de Checkout Pro con una clave idempotente (el id de la
 *     transacción): reintentar tras un fallo de red no genera una segunda preferencia.
 *  4. Repetir la petición con la misma `idempotencyKey` devuelve el mismo checkout.
 *
 * El resultado de la compra NO se conoce aquí: lo confirma el webhook verificado.
 */
export async function createCheckout({ productId, idempotencyKey, userId }: CreateCheckoutInput): Promise<{ checkoutUrl: string }> {
  const product = getProduct(productId);
  if (!product) throw new AppError("El producto no existe.", 400, "invalid_product");

  const secret = paymentsSecret();
  let tx = await fetchQuery(api.payments.getByIdempotencyKey, { secret, idempotencyKey });
  if (tx && ((tx.userId ?? null) !== userId || tx.productId !== productId)) {
    throw new AppError("La clave de idempotencia ya se usó en otra compra.", 409, "idempotency_conflict");
  }
  if (tx?.checkoutUrl) return { checkoutUrl: tx.checkoutUrl };

  if (!tx) {
    const id = await fetchMutation(api.payments.createTransaction, {
      secret,
      userId: userId ?? undefined,
      idempotencyKey,
      productId,
      title: product.title,
      amount: product.unitPrice,
      currency: product.currency,
    });
    tx = await fetchQuery(api.payments.getById, { secret, id });
  }
  if (!tx) throw new Error("No se pudo registrar la transacción.");

  const appUrl = getAppUrl();
  const publicApp = isPublicHttps(appUrl);
  const preference = await new Preference(getMercadoPagoConfig()).create({
    body: {
      items: [{ id: productId, title: product.title, quantity: 1, unit_price: product.unitPrice, currency_id: product.currency }],
      external_reference: tx._id,
      // Estas páginas SOLO informan al usuario. Nunca aprueban nada.
      back_urls: {
        success: `${appUrl}/payments/success`,
        pending: `${appUrl}/payments/pending`,
        failure: `${appUrl}/payments/failure`,
      },
      // Mercado Pago exige URLs públicas con https para estas dos opciones (ver lib/payments/mercadopago.ts).
      ...(publicApp ? { auto_return: "approved", notification_url: `${appUrl}/api/webhooks/mercadopago` } : {}),
    },
    requestOptions: { idempotencyKey: tx._id },
  });

  if (!preference.id || !preference.init_point) throw new Error("Mercado Pago no devolvió una URL de checkout.");
  await fetchMutation(api.payments.setPreference, { secret, id: tx._id, preferenceId: preference.id, checkoutUrl: preference.init_point });
  return { checkoutUrl: preference.init_point };
}
