// Extra IA: capa server-side agnóstica de proveedor (OpenAI y/o Anthropic).

export default {
  id: 'extra-ai',
  when: (cfg) => cfg.extras.includes('ai'),
  templates: 'extras/ai',
  summary: 'IA server-side con interfaz común y adaptadores OpenAI/Anthropic (ver docs/extras/ai.md).',
  dependencies: ['openai', '@anthropic-ai/sdk'],
  env: [
    {
      key: 'AI_PROVIDER',
      description: 'Proveedor de IA activo: "openai" o "anthropic".',
      secret: false,
      example: 'openai',
      where: 'Elige uno; solo se exige la clave del proveedor activo.',
    },
    {
      key: 'OPENAI_API_KEY',
      description: 'Clave de la API de OpenAI (solo si AI_PROVIDER=openai).',
      secret: true,
      example: '',
      where: 'https://platform.openai.com/api-keys',
    },
    {
      key: 'OPENAI_MODEL',
      description: 'Modelo de OpenAI a usar (sin valor por defecto: la lista cambia).',
      secret: false,
      example: '',
      where: 'Lista vigente: https://platform.openai.com/docs/models',
    },
    {
      key: 'ANTHROPIC_API_KEY',
      description: 'Clave de la API de Anthropic (solo si AI_PROVIDER=anthropic).',
      secret: true,
      example: '',
      where: 'https://console.anthropic.com/settings/keys',
    },
    {
      key: 'ANTHROPIC_MODEL',
      description: 'Modelo de Anthropic a usar (sin valor por defecto: la lista cambia).',
      secret: false,
      example: '',
      where: 'Lista vigente: https://docs.anthropic.com/en/docs/about-claude/models',
    },
  ],
  stack: ['IA server-side: interfaz `AiProvider` con adaptadores OpenAI y Anthropic (`src/lib/ai`)'],
  notes: [
    'IA: usa siempre `getAiProvider()` (`src/lib/ai`) desde el servidor, nunca un SDK directo; ejemplo en `src/services/ai-service.ts`. Valida la entrada, autoriza y limita peticiones (costo). Ver `docs/extras/ai.md`.',
  ],
};
