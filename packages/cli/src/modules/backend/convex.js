// Backend: Convex (backend gestionado: base de datos reactiva + funciones TypeScript).
// No usa Prisma ni SQL: el modelo de datos es nativo (convex/schema.ts).
//
// SLOTS que este módulo DEFINE para que otros módulos (autenticación, pagos...) aporten al schema
// sin tocar sus archivos (la plantilla convex/schema.ts los imprime):
//   convexSchemaImports → líneas `import ...` adicionales (una por línea).
//   convexSchemaTables  → entradas dentro de defineSchema({ ... }), terminadas en coma
//                         (ej: `...authTables,` o `payments: defineTable({...}),`).
// Un módulo los usa declarando `slots: { convexSchemaImports: '...', convexSchemaTables: '...' }`.
//
// Contrato de `convex/_generated/*`: son los archivos que genera `npx convex dev`. Se incluyen en la
// plantilla para que `tsc` y `next build` funcionen SIN haber iniciado sesión en Convex; `convex dev`
// los vuelve a generar (y deben versionarse, tal como recomienda Convex).

export default {
  id: 'backend-convex',
  when: (cfg) => cfg.backend === 'convex',
  templates: 'backend/convex',
  // Guarda los mensajes de contacto en Convex en lugar de solo registrarlos en consola.
  overrides: ['src/services/contact-service.ts'],
  dependencies: ['convex'],
  scripts: {
    'convex:dev': 'convex dev',
    'convex:deploy': 'convex deploy',
    'convex:codegen': 'convex codegen',
  },
  env: [
    {
      key: 'NEXT_PUBLIC_CONVEX_URL',
      description: 'URL de tu deployment de Convex. Es pública: el navegador la usa para conectarse.',
      secret: false,
      example: 'https://tu-deployment.convex.cloud',
      where: 'La escribe `npx convex dev` en .env.local. También: Convex Dashboard → Settings → URL & Deploy Key.',
    },
    {
      key: 'CONVEX_DEPLOYMENT',
      description: 'Deployment de desarrollo al que apunta la CLI de Convex (no la lee la aplicación en runtime).',
      secret: false,
      example: 'dev:tu-deployment',
      where: 'La escribe `npx convex dev` en .env.local al crear o enlazar el proyecto.',
    },
  ],
  providers: [
    {
      importLine: 'import { ConvexClientProvider } from "@/lib/convex/client-provider";',
      open: '<ConvexClientProvider>',
      close: '</ConvexClientProvider>',
      order: 20,
    },
  ],
  slots: { convexSchemaImports: '', convexSchemaTables: '' },
  stack: ['Convex (backend gestionado: base de datos reactiva, queries/mutations/actions en TypeScript)'],
  notes: [
    'Convex: esquema en `convex/schema.ts`, funciones en `convex/*.ts` (query, mutation, action). `convex/_generated/` lo regenera `convex dev` y se versiona. Guía completa: `docs/DATABASE.md`.',
    'Convex: toda función pública valida sus argumentos con `v` y comprueba permisos dentro de su handler; el cliente puede llamar cualquier función pública directamente, sin pasar por tus Server Actions.',
    'Convex: antes del primer `dev` real ejecuta `npx convex dev` para enlazar un deployment; así `.env.local` recibe `NEXT_PUBLIC_CONVEX_URL`.',
  ],
};
