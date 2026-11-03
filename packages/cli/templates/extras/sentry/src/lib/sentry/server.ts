import * as Sentry from "@sentry/nextjs";

// Inicialización de Sentry en el runtime Node.js. Sin DSN el SDK queda inactivo
// (no envía nada), por eso es seguro tener el extra instalado sin configurarlo.
//
// Ajusta `tracesSampleRate` (0 a 1) según tu tráfico y tu plan de Sentry: cada
// transacción muestreada consume cuota. Por defecto Sentry NO envía IPs ni datos de usuario (PII); no lo actives salvo
// que necesites esos datos y tengas base legal para tratarlos.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
});
