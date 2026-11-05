import { z } from "zod";
import { AppError, errorResponse } from "@/lib/errors";
import { requireEnv } from "@/lib/env";
import { verifyWebhookSignature } from "@/lib/payments/signature";
import { handleNotification } from "@/services/payments/webhook-service";

// Webhook de Mercado Pago. Configura su URL en el panel de Mercado Pago:
// https://TU-DOMINIO/api/webhooks/mercadopago (ver docs/PAYMENTS.md).
//
// Mercado Pago llama con `?data.id=<id>&type=<tipo>` y las cabeceras `x-signature` y
// `x-request-id`. Orden obligatorio: 1) verificar la firma, 2) validar el formato,
// 3) procesar consultando el estado real a la API. Una petición sin firma válida
// jamás llega al paso 3.
const querySchema = z.object({
  id: z.string().min(1).max(128),
  type: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const dataId = url.searchParams.get("data.id");

    const valid = verifyWebhookSignature({
      secret: requireEnv("MERCADOPAGO_WEBHOOK_SECRET"),
      signatureHeader: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId,
    });
    if (!valid) throw new AppError("Firma no válida.", 401, "invalid_signature");

    const parsed = querySchema.safeParse({ id: dataId, type: url.searchParams.get("type") ?? url.searchParams.get("topic") });
    // Notificación firmada pero sin recurso (por ejemplo un ping): nada que procesar.
    if (!parsed.success) return new Response(null, { status: 200 });

    await handleNotification(parsed.data.type, parsed.data.id);
    return new Response(null, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
