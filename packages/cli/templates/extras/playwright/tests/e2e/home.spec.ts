import { expect, test } from "@playwright/test";

test("la página inicial muestra el título y el formulario de contacto", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/<%= name %>/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel("Nombre")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Mensaje")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible();
});

test("el formulario muestra errores de validación del servidor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByRole("status")).toHaveText("Revisa los campos marcados.");
});
