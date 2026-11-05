import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Configuración de Vitest para pruebas unitarias (ver docs/extras/vitest.md).
export default defineConfig({
  resolve: {
    alias: {
      // Mismo alias que tsconfig.json ("@/*" → "./src/*").
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` lanza un error al importarse fuera de un Server Component de Next.js.
      // En las pruebas se sustituye por un módulo vacío para poder probar servicios de servidor.
      "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    // Entorno node: se prueba lógica (esquemas, servicios). Para componentes de React usa
    // Playwright o agrega jsdom/happy-dom solo si de verdad lo necesitas.
    environment: "node",
    // Los tests e2e de Playwright (tests/e2e) los ejecuta otro runner.
    include: ["tests/unit/**/*.test.ts"],
  },
});
