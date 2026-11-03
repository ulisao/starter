// Extra Analytics: interfaz desacoplada de eventos (track / identify / page).
// No instala ningún proveedor: incluye uno "console" para desarrollo y un punto de enchufe.

export default {
  id: 'extra-analytics',
  when: (cfg) => cfg.extras.includes('analytics'),
  templates: 'extras/analytics',
  summary: 'Analytics: interfaz `track` / `identify` / `page` desacoplada del proveedor (consola en desarrollo).',
  stack: ['Analytics desacoplado (`src/lib/analytics`), sin proveedor instalado'],
  notes: [
    'Analytics: llama a `analytics.track/identify/page` de `src/lib/analytics`. Para usar PostHog, Plausible, GA u otro, implementa `AnalyticsProvider` y regístralo en `src/lib/analytics/index.ts` (ver `docs/extras/analytics.md`).',
  ],
};
