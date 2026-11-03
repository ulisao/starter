# Sentry (monitoreo de errores)

## Propósito

Capturar errores del servidor, del runtime Edge y del navegador con la integración oficial `@sentry/nextjs`, para enterarte de fallos en producción con su stack trace.

## Arquitectura

| Archivo | Función |
| --- | --- |
| `src/instrumentation.ts` | `register()` carga la configuración según el runtime; `onRequestError` reporta errores de Server Components, Route Handlers, Server Actions y proxy. |
| `src/lib/sentry/server.ts` y `edge.ts` | `Sentry.init` para Node.js y Edge. |
| `src/instrumentation-client.ts` | `Sentry.init` en el navegador. |
| `src/app/global-error.tsx` | Reporta errores de renderizado del layout raíz. |
| `next.config.ts` | Envuelto con `withSentryConfig` (instrumenta el build y sube source maps). |

Sin `NEXT_PUBLIC_SENTRY_DSN` el SDK queda inactivo: no envía nada y no rompe la aplicación.

## Configuración

1. Crea un proyecto "Next.js" en sentry.io.
2. Copia el **DSN** (Settings, Projects, tu proyecto, Client Keys) en `NEXT_PUBLIC_SENTRY_DSN`. Es público; no es un secreto.
3. Para **source maps** (stack traces legibles): crea un Auth Token (Settings, Auth Tokens), guárdalo en `SENTRY_AUTH_TOKEN` y define `SENTRY_ORG` y `SENTRY_PROJECT` con los slugs.

El token solo se usa durante `next build`. Si no está definido, el build **no falla**: simplemente no se suben source maps (`sourcemaps.disable`).

## Variables de entorno

| Variable | Secreta | Cuándo se usa |
| --- | --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Build y runtime (se incrusta en el JS del navegador). |
| `SENTRY_AUTH_TOKEN` | Sí | Solo build (subida de source maps). |
| `SENTRY_ORG`, `SENTRY_PROJECT` | No | Solo build. |

## Vercel

Define las variables en Project Settings, Environment Variables. `NEXT_PUBLIC_SENTRY_DSN` debe existir **en el build**, porque se incrusta al compilar. La integración oficial de Sentry para Vercel también puede configurarlas.

## Docker

`NEXT_PUBLIC_SENTRY_DSN` se incrusta al construir la imagen, así que debe pasarse como build arg (no basta definirla al ejecutar el contenedor). **No pases `SENTRY_AUTH_TOKEN` como `ARG` o `ENV` normal**: quedaría en las capas de la imagen. Usa BuildKit secrets (`docker build --secret id=sentry_token,env=SENTRY_AUTH_TOKEN`, leído con `RUN --mount=type=secret`) o sube los source maps desde tu CI y construye la imagen sin token. El Dockerfile generado no incluye este paso: agrégalo si lo necesitas.

## Ajustes habituales

- `tracesSampleRate`: porcentaje de transacciones medidas (consume la cuota de tu plan).
- `tunnelRoute: "/monitoring"` en `withSentryConfig` evita bloqueadores de anuncios, a costa de más carga en tu servidor.
- Session Replay y User Feedback: agrégalos con `Sentry.replayIntegration()` o `Sentry.feedbackIntegration()` en `instrumentation-client.ts`, después de revisar privacidad.

## Errores frecuentes

- No llegan eventos: revisa que `NEXT_PUBLIC_SENTRY_DSN` estuviera definido **al hacer el build**.
- Stack traces minificados: falta `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` o `SENTRY_PROJECT` en el build.
