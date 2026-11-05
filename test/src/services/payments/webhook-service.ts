import "server-only";
import { syncPayment } from "./transactions";

/**
 * Procesa una notificación de Mercado Pago YA verificada (firma válida).
 *
 * De la notificación solo se usa el tipo y el id del recurso. El estado real se
 * consulta a la API de Mercado Pago dentro de cada función de sincronización.
 * Los tipos que esta aplicación no usa se ignoran con éxito (200) para que Mercado
 * Pago no los reintente. Si algo falla, el error se propaga: el webhook responde 500
 * y Mercado Pago reintenta, por lo que todas las rutas deben ser idempotentes.
 */
export async function handleNotification(type: string, resourceId: string): Promise<void> {
  switch (type) {
    case "payment":
      await syncPayment(resourceId);
      return;
    default:
      return;
  }
}
