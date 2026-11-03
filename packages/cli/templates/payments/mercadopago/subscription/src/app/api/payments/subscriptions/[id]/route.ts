import { AppError, errorResponse } from "@/lib/errors";
<%#if hasAuth%>
import { getSessionUserId } from "@/lib/auth/session";
<%#endif%>
import { cancelSubscription } from "@/services/payments/subscriptions";

// Cancela una suscripción. La autorización se decide en el servidor: solo su dueño puede cancelarla.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
<%#if hasAuth%>
    const userId = await getSessionUserId();
    if (!userId) throw new AppError("Debes iniciar sesión.", 401, "unauthorized");
<%#else%>
    // Sin autenticación no hay forma de saber quién es el dueño: la cancelación siempre se rechaza.
    // Cancela desde el panel de Mercado Pago o agrega autenticación (ver docs/PAYMENTS.md).
    const userId = null as string | null;
    if (!userId) throw new AppError("La cancelación requiere autenticación.", 401, "unauthorized");
<%#endif%>
    const { id } = await params;
    await cancelSubscription(id, userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
