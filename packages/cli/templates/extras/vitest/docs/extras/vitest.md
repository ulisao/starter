# Vitest (pruebas unitarias)

## Propósito

Pruebas rápidas de lógica pura: esquemas Zod, servicios y utilidades. Corre en entorno `node` (sin navegador). Para flujos de interfaz usa Playwright (`docs/extras/playwright.md`, si está instalado).

## Arquitectura

- `vitest.config.ts`: alias `@` → `src` (igual que `tsconfig.json`) y busca pruebas en `tests/unit/**/*.test.ts`.
- `server-only`: el paquete lanza un error si se importa fuera de Next.js. La configuración lo sustituye por `tests/support/server-only.ts` (módulo vacío) para que puedas probar servicios que importan `server-only`. Si un servicio lee secretos con `requireEnv`, define la variable dentro del test (`vi.stubEnv("NOMBRE", "valor")`).
- `tests/unit/contact-schema.test.ts`: ejemplo real que prueba el esquema del formulario de contacto.

## Comandos

- `<%= runCmd %> test` ejecuta todas las pruebas una vez (CI).
- `<%= runCmd %> test:watch` las reejecuta al guardar.

## Ejemplo

```ts
import { describe, expect, it } from "vitest";
import { miFuncion } from "@/lib/mi-funcion";

describe("miFuncion", () => {
  it("devuelve el valor esperado", () => {
    expect(miFuncion(2)).toBe(4);
  });
});
```

## Errores frecuentes

- **`This module cannot be imported from a Client Component module`**: falta el alias de `server-only`; revisa `vitest.config.ts`.
- **`Cannot find module '@/...'`**: el alias `@` debe apuntar a `src` en `vitest.config.ts`.
- **Probar componentes React**: requiere `jsdom` y `@testing-library/react`; no están incluidos para mantener el proyecto liviano.
