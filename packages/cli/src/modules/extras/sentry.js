// Extra Sentry: monitoreo de errores con la integración oficial @sentry/nextjs.
// Envuelve next.config.ts mediante los slots nextConfigImports / nextConfigWrappers.

export default {
  id: 'extra-sentry',
  when: (cfg) => cfg.extras.includes('sentry'),
  templates: 'extras/sentry',
  summary: 'Sentry: captura de errores (servidor, edge y navegador) con `@sentry/nextjs`.',
  dependencies: ['@sentry/nextjs'],
  env: [
    {
      key: 'NEXT_PUBLIC_SENTRY_DSN',
      description: 'DSN del proyecto de Sentry. Es público por diseño (viaja al navegador). Sin DSN, Sentry queda inactivo.',
      secret: false,
      example: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      where: 'sentry.io → Settings → Projects → tu proyecto → Client Keys (DSN).',
    },
    {
      key: 'SENTRY_AUTH_TOKEN',
      description: 'Token para subir source maps durante el build. Solo build; sin él no se suben source maps y el build no falla.',
      secret: true,
      example: 'sntrys_xxxxxxxxxxxxxxxx',
      where: 'sentry.io → Settings → Auth Tokens (o Organization Tokens).',
    },
    {
      key: 'SENTRY_ORG',
      description: 'Slug de tu organización en Sentry (solo build, para subir source maps).',
      secret: false,
      example: 'mi-organizacion',
      where: 'sentry.io → Settings → General Settings → Organization Slug.',
    },
    {
      key: 'SENTRY_PROJECT',
      description: 'Slug del proyecto en Sentry (solo build, para subir source maps).',
      secret: false,
      example: 'mi-proyecto',
      where: 'sentry.io → Settings → Projects → tu proyecto.',
    },
  ],
  slots: {
    nextConfigImports: 'import { withSentryConfig } from "@sentry/nextjs/config";',
    nextConfigWrappers: [
      '// Sentry: instrumenta el build y sube source maps SOLO si hay SENTRY_AUTH_TOKEN.',
      '// Sin token el build funciona igual (sin source maps en Sentry). Ver docs/extras/sentry.md.',
      'config = withSentryConfig(config, {',
      '  org: process.env.SENTRY_ORG,',
      '  project: process.env.SENTRY_PROJECT,',
      '  authToken: process.env.SENTRY_AUTH_TOKEN,',
      '  silent: !process.env.CI,',
      '  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },',
      '});',
    ].join('\n'),
  },
  stack: ['Sentry (@sentry/nextjs) para monitoreo de errores'],
  notes: [
    'Sentry: se inicializa en `src/instrumentation.ts` (servidor/edge) y `src/instrumentation-client.ts` (navegador); `src/app/global-error.tsx` reporta errores de renderizado. Sin `NEXT_PUBLIC_SENTRY_DSN` queda inactivo. Detalles y límites en `docs/extras/sentry.md`.',
  ],
};
