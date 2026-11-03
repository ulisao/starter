# Tests y validación

## Propósito

Cómo comprobar que un cambio no rompió nada.

## Comandos

| Comando | Qué valida |
| --- | --- |
| `<%= runCmd %> typecheck` | Tipos de TypeScript |
<%#if hasBiome%>
| `<%= runCmd %> lint` | Lint y formato (Biome) |
<%#endif%>
<%#if hasVitest%>
| `<%= runCmd %> test` | Tests unitarios (Vitest) |
<%#endif%>
<%#if hasPlaywright%>
| `<%= runCmd %> test:e2e` | Tests end-to-end (Playwright) |
<%#endif%>
| `<%= runCmd %> build` | Build de producción |

<%#if hasVitest%>
## Unitarios (Vitest)

Viven en `tests/unit/`. Prueban lógica de `src/services/` y esquemas Zod sin red ni base de datos. Ejemplo: `tests/unit/contact-schema.test.ts`.
<%#endif%>
<%#if hasPlaywright%>
## End-to-end (Playwright)

Viven en `tests/e2e/`. Playwright levanta el servidor con `<%= runCmd %> dev` (ver `playwright.config.ts`). La primera vez instala los navegadores con `<%= execCmd %> playwright install`.
<%#endif%>
<%#if !hasVitest%>
<%#if !hasPlaywright%>
Este proyecto se generó sin Vitest ni Playwright. El mínimo de validación es `typecheck` y `build`. Si agregas una herramienta de tests, documenta aquí cómo ejecutarla.
<%#endif%>
<%#endif%>

## Criterio de "terminado"

Una tarea no está terminada hasta que typecheck y build pasan. Reporta siempre el resultado real de los comandos.
