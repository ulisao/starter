// Extra: Playwright para pruebas end-to-end en navegador real.

export default {
  id: 'extra-playwright',
  when: (cfg) => cfg.extras.includes('playwright'),
  templates: 'extras/playwright',
  devDependencies: ['@playwright/test'],
  scripts: { 'test:e2e': 'playwright test' },
  summary: 'Playwright: pruebas end-to-end en `tests/e2e/`. Doc: `docs/extras/playwright.md`.',
  stack: ['Playwright (pruebas e2e en `tests/e2e/`)'],
  notes: ['Playwright: antes del primer `test:e2e` instala el navegador con el comando de `docs/extras/playwright.md`.'],
};
