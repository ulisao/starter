# Arquitectura del generador

## Propósito

Explica cómo está construido Baretta Starter por dentro: qué responsabilidad tiene cada pieza y cómo se componen los proyectos. Si vas a agregar una tecnología nueva, empieza por aquí y sigue con `docs/TEMPLATES.md`.

## Idea central

El generador **no conoce** ninguna tecnología concreta. Solo sabe componer **módulos**. Cada módulo declara cuándo aplica, qué archivos aporta, qué dependencias necesita y qué variables de entorno define. Agregar Clerk, Convex o Mercado Pago es agregar un módulo y su carpeta de plantillas; el núcleo no cambia.

```text
packages/cli/
├── bin/baretta.js               Punto de entrada del binario
├── src/
│   ├── index.js                 Enrutador de comandos (create, compatibility)
│   ├── cli/
│   │   ├── commands/            Un archivo por comando
│   │   └── prompts/wizard.js    Asistente interactivo (@clack/prompts)
│   ├── core/
│   │   ├── configuration/       Esquema de opciones y reglas de validación
│   │   ├── compatibility/       Carga de perfiles y resolución de versiones
│   │   ├── filesystem/          Motor de plantillas
│   │   ├── package-manager/     Detección e instalación (npm/pnpm/yarn/bun)
│   │   └── generator/           plan() y writeProject()
│   └── modules/<capa>/*.js      Módulos (backend, auth, payments, extras, deployment, base)
├── templates/<capa>/<modulo>/   Archivos que cada módulo aporta
├── compatibility/               Perfiles, fichas de paquetes y combinaciones
└── tests/                       unit/ e integration/
```

## Flujo de `baretta create`

1. **Wizard** (`cli/prompts/wizard.js`): pregunta solo lo relevante; cada flag de la CLI evita su pregunta.
2. **Validación** (`core/configuration/schema.js`): rechaza combinaciones imposibles con el motivo (ej: Supabase Auth con PostgreSQL propio).
3. **plan(cfg)** (`core/generator`): sin escribir nada, calcula todos los archivos:
   - carga el perfil de compatibilidad y resuelve las versiones;
   - activa los módulos cuyo `when(cfg)` es verdadero;
   - junta dependencias, scripts, variables de entorno, providers y slots;
   - renderiza las plantillas de cada módulo y **detecta conflictos** de archivos;
   - genera `package.json`, `.env.example` y `baretta.config.json`.
4. **Resumen** y confirmación del usuario.
5. **writeProject**: escribe en disco (se niega a usar una carpeta con contenido).
6. **Instalación** opcional; si falla, el proyecto se conserva.

`plan()` es puro respecto del disco, por eso los tests de integración generan toda la matriz en memoria.

## Composición por capas

Orden: `base → backend → auth → payments → extras → deployment`. Una capa posterior puede reemplazar un archivo de una anterior **solo** si lo declara en `overrides`; si no, el generador falla con un error de conflicto (nunca se sobrescribe en silencio).

Dos mecanismos evitan que los módulos se pisen:

- **providers**: cada módulo declara su proveedor React y el generador los anida en `src/components/providers.tsx` según `order`.
- **slots**: puntos de extensión con nombre dentro de una plantilla (por ejemplo las tablas del schema de Convex o el envoltorio de `next.config.ts`). Cada módulo aporta texto; la plantilla lo imprime con `<%= slot_nombre %>`.

## Qué decide cada capa

| Capa | Ejemplos | Se activa por |
| --- | --- | --- |
| base | Next.js, Tailwind, estructura, AGENTS.md, docs | siempre |
| backend | Convex, Supabase, PostgreSQL, Prisma | `cfg.backend` |
| auth | Clerk, Supabase Auth, Better Auth, Convex Auth | `cfg.auth` + `cfg.authMethod` |
| payments | Mercado Pago | `cfg.payments` |
| extras | Resend, Sentry, Biome, Vitest... | `cfg.extras` |
| deployment | Vercel + Docker | siempre |

## Contratos entre módulos

- Todo módulo de autenticación exporta `getSessionUserId()` desde `src/lib/auth/session.ts` (lo usa pagos).
- El extra Resend exporta `sendEmail()` desde `src/lib/email/send.ts` (lo usan los métodos de acceso por email).
- Las variables `NEXT_PUBLIC_*` se declaran en el `env` del módulo: el Dockerfile genera sus `ARG` desde esa lista.

## Compatibilidad

Ninguna versión está escrita en plantillas ni en código. Ver `docs/COMPATIBILITY.md`.

## Decisiones

Ver `docs/DECISIONS.md`.
