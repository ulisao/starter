import { defineConfig, devices } from "@playwright/test";

// Configuración de Playwright (ver docs/extras/playwright.md).
// Antes del primer uso instala el navegador: npx playwright install chromium
const port = 3000;

export default defineConfig({
  testDir: "./tests/e2e",
  // En CI se ejecuta secuencialmente y se reintenta una vez para absorber fallos intermitentes.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Levanta la aplicación automáticamente. En CI usa el build ya generado (`start`);
  // en local usa `dev` y reutiliza un servidor que ya esté corriendo.
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
