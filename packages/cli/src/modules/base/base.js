// Módulo base: Next.js + TypeScript + Tailwind + estructura pro-IA + documentación común.
// Siempre aplica. Es la primera capa; todas las demás se montan sobre ella.

export default {
  id: 'base',
  when: () => true,
  templates: 'base',
  dependencies: ['next', 'react', 'react-dom', 'zod', 'server-only'],
  devDependencies: ['typescript', '@types/node', '@types/react', '@types/react-dom', 'tailwindcss', '@tailwindcss/postcss', 'postcss'],
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    typecheck: 'tsc --noEmit',
  },
  env: [
    {
      key: 'NEXT_PUBLIC_APP_URL',
      description: 'URL pública de la aplicación (sin barra final). Se usa para URLs absolutas y redirecciones.',
      example: 'http://localhost:3000',
      secret: false,
      where: 'En desarrollo: http://localhost:3000. En producción: tu dominio (ej: https://miapp.com).',
    },
  ],
  // Puntos de extensión de next.config.ts: los módulos aportan imports y código que envuelve la config.
  slots: { nextConfigImports: '', nextConfigWrappers: '' },
  stack: ['Next.js 16 (App Router) + React 19 + TypeScript estricto', 'Tailwind CSS 4 con tokens de diseño en variables CSS', 'Zod para validación de entradas'],
  notes: [
    'Base: las rutas viven en `src/app/`, la lógica en `src/services/` y las integraciones en `src/lib/`. Ejemplo completo de feature: `src/features/contact/`.',
  ],
};
