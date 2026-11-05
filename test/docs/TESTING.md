# Tests y validación

## Propósito

Cómo comprobar que un cambio no rompió nada.

## Comandos

| Comando | Qué valida |
| --- | --- |
| `npm run typecheck` | Tipos de TypeScript |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests end-to-end (Playwright) |
| `npm run build` | Build de producción |

## Unitarios (Vitest)

Viven en `tests/unit/`. Prueban lógica de `src/services/` y esquemas Zod sin red ni base de datos. Ejemplo: `tests/unit/contact-schema.test.ts`.
## End-to-end (Playwright)

Viven en `tests/e2e/`. Playwright levanta el servidor con `npm run dev` (ver `playwright.config.ts`). La primera vez instala los navegadores con `npx playwright install`.

## Criterio de "terminado"

Una tarea no está terminada hasta que typecheck y build pasan. Reporta siempre el resultado real de los comandos.
