import { createHmac, timingSafeEqual } from "node:crypto";

export type WebhookSignatureInput = {
  /** Clave secreta del webhook (MERCADOPAGO_WEBHOOK_SECRET). */
  secret: string;
  /** Valor de la cabecera `x-signature`, con formato `ts=...,v1=...`. */
  signatureHeader: string | null;
  /** Valor de la cabecera `x-request-id`. */
  requestId: string | null;
  /** Parámetro `data.id` de la query string de la notificación. */
  dataId: string | null;
};

/**
 * Verifica la firma de una notificación de Mercado Pago.
 *
 * Es una función PURA (sin I/O ni lectura de entorno) para poder probarla de forma
 * aislada con `node --test`. Sigue la documentación oficial: el "manifest" es
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` (omitiendo las partes ausentes;
 * el id se pasa a minúsculas si es alfanumérico) y la firma esperada es su HMAC
 * SHA-256 en hexadecimal con la clave secreta del webhook.
 *
 * No valida la antigüedad de `ts`: una notificación reenviada no es peligrosa porque
 * el procesamiento nunca confía en su contenido, solo consulta el estado real a la API.
 */
export function verifyWebhookSignature({ secret, signatureHeader, requestId, dataId }: WebhookSignatureInput): boolean {
  if (!secret || !signatureHeader) return false;

  const parts = new Map<string, string>();
  for (const part of signatureHeader.split(",")) {
    const separator = part.indexOf("=");
    if (separator > 0) parts.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }
  const ts = parts.get("ts");
  const received = parts.get("v1");
  if (!ts || !received) return false;

  const id = dataId && /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = "";
  if (id) manifest += `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = Buffer.from(createHmac("sha256", secret).update(manifest).digest("hex"));
  const actual = Buffer.from(received);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
