import * as Sentry from "@sentry/nextjs";

// Inicialización de Sentry en el navegador. Next.js carga este archivo antes de
// que la aplicación sea interactiva. El DSN es público por diseño: puede ir en
// NEXT_PUBLIC_SENTRY_DSN. Sin DSN, Sentry queda inactivo.
//
// Session Replay y User Feedback no están activados: agregan peso al bundle y
// tratan datos de usuarios (revisa tu política de privacidad antes de habilitarlos).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
});

// Permite a Sentry medir las navegaciones del App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
