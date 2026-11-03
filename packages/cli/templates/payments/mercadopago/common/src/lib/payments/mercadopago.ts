import "server-only";
import { MercadoPagoConfig } from "mercadopago";
import { requireEnv } from "@/lib/env";

/**
 * Configuración del SDK oficial de Mercado Pago.
 *
 * Se crea al primer uso (no al importar el módulo) para que `next build` no exija
 * el access token. El token es SECRETO: vive solo en el servidor y jamás debe
 * llevar el prefijo NEXT_PUBLIC_. Si usas credenciales de prueba (TEST-...), todos
 * los pagos ocurren en sandbox; cambia a las de producción solo al salir a producción.
 *
 * Cada llamada que crea recursos debe pasar `requestOptions.idempotencyKey` para
 * que un reintento de red no duplique el cobro.
 */
let config: MercadoPagoConfig | undefined;

export function getMercadoPagoConfig(): MercadoPagoConfig {
  config ??= new MercadoPagoConfig({
    accessToken: requireEnv("MERCADOPAGO_ACCESS_TOKEN"),
    options: { timeout: 8000 },
  });
  return config;
}

/** URL pública de la aplicación sin barra final (base de back_urls y notification_url). */
export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Mercado Pago solo puede llamar a `notification_url` y aplicar `auto_return` si la
 * URL es pública y usa https. En local (http://localhost) ambos se omiten: usa un
 * túnel (ver src/features/payments/AGENTS.md) o configura el webhook en el panel.
 */
export function isPublicHttps(url: string): boolean {
  return url.startsWith("https://");
}
