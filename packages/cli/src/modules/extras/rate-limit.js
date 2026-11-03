// Extra Rate limiting: interfaz `RateLimiter` con almacenamiento distribuido (Upstash Redis).
// El adaptador en memoria existe SOLO para desarrollo y pruebas.

export default {
  id: 'extra-rate-limit',
  when: (cfg) => cfg.extras.includes('rate-limit'),
  templates: 'extras/rate-limit',
  summary: 'Rate limiting: interfaz `RateLimiter` con Upstash Redis (distribuido) y adaptador en memoria solo para desarrollo.',
  dependencies: ['@upstash/ratelimit', '@upstash/redis'],
  env: [
    {
      key: 'UPSTASH_REDIS_REST_URL',
      description: 'URL REST de tu base Redis en Upstash. Obligatoria en producción para limitar solicitudes.',
      secret: true,
      example: 'https://xxxx.upstash.io',
      where: 'console.upstash.com → Redis → tu base → REST API.',
    },
    {
      key: 'UPSTASH_REDIS_REST_TOKEN',
      description: 'Token REST de Upstash (lectura/escritura).',
      secret: true,
      example: 'AXxxxxxxxxxxxxxxxxxxxxxxxx',
      where: 'console.upstash.com → Redis → tu base → REST API → Token.',
    },
  ],
  stack: ['Rate limiting con Upstash Redis (`@upstash/ratelimit`)'],
  notes: [
    'Rate limit: usa `createRateLimiter()` y `enforceRateLimit()` de `src/lib/rate-limit/` en Route Handlers y Server Actions. En producción exige Upstash; el adaptador en memoria NO protege en serverless. Ejemplos en `docs/extras/rate-limit.md`.',
  ],
};
