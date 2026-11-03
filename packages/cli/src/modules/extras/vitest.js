// Extra: Vitest para pruebas unitarias (entorno node, sin jsdom).

export default {
  id: 'extra-vitest',
  when: (cfg) => cfg.extras.includes('vitest'),
  templates: 'extras/vitest',
  devDependencies: ['vitest'],
  scripts: { test: 'vitest run', 'test:watch': 'vitest' },
  summary: 'Vitest: pruebas unitarias con alias `@` y soporte para `server-only`. Doc: `docs/extras/vitest.md`.',
  stack: ['Vitest (pruebas unitarias en `tests/unit/`)'],
  notes: ['Vitest: pruebas en `tests/unit/**/*.test.ts`; `test` las ejecuta una vez y `test:watch` en modo interactivo. Ver `docs/extras/vitest.md`.'],
};
