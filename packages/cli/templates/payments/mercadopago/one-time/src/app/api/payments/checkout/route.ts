import { z } from "zod";
import { AppError, errorResponse } from "@/lib/errors";
<%#if hasAuth%>
import { getSessionUserId } from "@/lib/auth/session";
<%#endif%>
import { createCheckout } from "@/services/payments/checkout-service";

// Crea el checkout de un producto del catálogo y devuelve la URL de Mercado Pago.
// El cliente envía el id del producto, NUNCA el precio (lo decide el servidor).
const bodySchema = z.object({
  productId: z.string().min(1).max(64),
  idempotencyKey: z.uuid(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AppError("Datos de compra no válidos.", 400, "invalid_request");

<%#if hasAuth%>
    // TODO (decisión de negocio): si solo deben comprar usuarios registrados,
    // responde 401 cuando `userId` sea null. Por defecto se permite comprar sin sesión.
    const userId = await getSessionUserId();
<%#else%>
    // Este proyecto no tiene autenticación: los pagos no se asocian a ningún usuario.
    const userId = null;
<%#endif%>
    const { checkoutUrl } = await createCheckout({ ...parsed.data, userId });
    return Response.json({ checkoutUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
