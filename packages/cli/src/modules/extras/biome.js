// Extra: Biome (linter + formateador unificado). Reemplaza a ESLint y Prettier:
// Next.js 16 ya no incluye `next lint`, así que el lint se ejecuta con Biome directamente.

export default {
  id: 'extra-biome',
  when: (cfg) => cfg.extras.includes('biome'),
  templates: 'extras/biome',
  devDependencies: ['@biomejs/biome'],
  scripts: {
    lint: 'biome check',
    'lint:fix': 'biome check --write',
    format: 'biome format --write',
  },
  summary: 'Biome: linter y formateador único (sin ESLint ni Prettier). Doc: `docs/extras/biome.md`.',
  stack: ['Biome (lint + formato) en lugar de ESLint/Prettier'],
  notes: ['Biome: configuración en `biome.json`; `lint` revisa y `lint:fix`/`format` corrigen. No agregues ESLint ni Prettier. Ver `docs/extras/biome.md`.'],
};
