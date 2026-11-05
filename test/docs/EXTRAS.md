# Extras instalados

## Propósito

Resume los módulos opcionales seleccionados al crear el proyecto. Cada uno incluye su propia configuración, variables de entorno y notas en `AGENTS.md`.

- **playwright** — Playwright: pruebas end-to-end en `tests/e2e/`. Doc: `docs/extras/playwright.md`.
- **rate-limit** — Rate limiting: interfaz `RateLimiter` con Upstash Redis (distribuido) y adaptador en memoria solo para desarrollo.
- **resend** — Resend: emails transaccionales con `sendEmail()` (server-only) en `src/lib/email/send.ts`.
- **vitest** — Vitest: pruebas unitarias con alias `@` y soporte para `server-only`. Doc: `docs/extras/vitest.md`.

## Agregar un extra más adelante

Los extras se generan con Baretta Starter. Para sumar uno después de crear el proyecto, genera un proyecto de prueba con ese extra y copia sus archivos, dependencias (con las versiones del perfil de compatibilidad) y variables de entorno, o consulta `baretta.config.json` para reproducir la configuración.
