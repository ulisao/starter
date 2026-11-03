import * as Sentry from "@sentry/nextjs";

/**
 * Next.js ejecuta `register` una vez al arrancar el servidor. Aquí se carga la
 * configuración de Sentry según el runtime (Node.js o Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/sentry/server");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("@/lib/sentry/edge");
  }
}

// Reporta a Sentry los errores de Server Components, Route Handlers, Server Actions y proxy.
export const onRequestError = Sentry.captureRequestError;
