import { z } from "zod";
import { AppError, errorResponse } from "@/lib/errors";
<%#if hasAuth%>
import { getSessionUserId } from "@/lib/auth/session";
<%#endif%>
import { createSubscription } from "@/services/payments/subscriptions";

// Crea una suscripción a un plan del catálogo y devuelve la URL donde el comprador la autoriza.
// El cliente envía el id del plan y su email, NUNCA el monto (lo decide el servidor).
const bodySchema = z.object({
  planId: z.string().min(1).max(64),
  payerEmail: z.email().max(254),
  idempotencyKey: z.uuid(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AppError("Datos de suscripción no válidos.", 400, "invalid_request");

<%#if hasAuth%>
    // TODO (decisión de negocio): si solo deben suscribirse usuarios registrados,
    // responde 401 cuando `userId` sea null. Por defecto se permite suscribirse sin sesión,
    // pero entonces la suscripción no podrá cancelarse desde la API.
    const userId = await getSessionUserId();
<%#else%>
    // Este proyecto no tiene autenticación: las suscripciones no se asocian a ningún usuario.
    const userId = null;
<%#endif%>
    const { checkoutUrl } = await createSubscription({ ...parsed.data, userId });
    return Response.json({ checkoutUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
