import type { AnalyticsProvider } from "./types";

/**
 * Proveedor de desarrollo: imprime los eventos en la consola y no envía nada.
 * En producción no hace nada, para no ensuciar los logs. Sirve de referencia al
 * implementar un proveedor real.
 */
export const consoleProvider: AnalyticsProvider = {
  track(event, properties) {
    log("track", event, properties);
  },
  identify(userId, traits) {
    log("identify", userId, traits);
  },
  page(name, properties) {
    log("page", name ?? "(sin nombre)", properties);
  },
};

function log(kind: string, subject: string, data?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[analytics] ${kind}: ${subject}`, data ?? "");
}
