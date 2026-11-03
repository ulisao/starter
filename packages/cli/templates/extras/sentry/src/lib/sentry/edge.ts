import * as Sentry from "@sentry/nextjs";

// Inicialización de Sentry en el runtime Edge (proxy.ts y rutas con runtime "edge").
// Mantén estos valores alineados con ./server.ts.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
  sendDefaultPii: false,
});
