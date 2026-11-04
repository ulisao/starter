# baretta

Generador modular de proyectos **Next.js** de Estudio Baretta, optimizado para trabajar con agentes de IA.

```bash
npx baretta create
```

Respondés unas preguntas y obtenés un proyecto Next.js listo: backend, autenticación, pagos, extras y despliegue, con una combinación de versiones **que funciona en conjunto** (no la última de cada paquete).

> Este paquete **aún no está publicado en npm**. Se usa desde el repositorio del monorepo (`npm link`). Ver el README raíz para el estado del proyecto y la guía de desarrollo.

## Uso

```bash
# Asistente interactivo
npx baretta create

# No interactivo
npx baretta create mi-app \
  --backend convex --auth clerk --auth-method google \
  --payments subscription --extras biome,vitest --pm pnpm --install skip --yes

# Perfil de compatibilidad y estado de cada combinación
npx baretta compatibility
```

Opciones de `create`: `--backend` (`convex` | `supabase` | `postgres`), `--auth` (`clerk` | `supabase-auth` | `better-auth` | `convex-auth` | `none`), `--auth-method` (`password` | `password-google` | `google` | `magic-link` | `otp`), `--payments` (`none` | `one-time` | `subscription`), `--extras`, `--pm`, `--install`, `--dir`, `--yes`. Las combinaciones inválidas se rechazan con el motivo antes de generar nada.

## Qué genera

- **Next.js** (App Router) + React 19 + TypeScript estricto + Tailwind CSS 4.
- **Backend**: Convex (nativo), Supabase (+ Prisma) o PostgreSQL propio (+ Prisma).
- **Autenticación**: Clerk, Supabase Auth, Better Auth o Convex Auth (experimental).
- **Pagos** con Mercado Pago (pago único o suscripción) con webhook firmado e idempotencia.
- **Despliegue**: Vercel y Docker (multi-stage, usuario no root).
- **Estructura pro-IA**: `AGENTS.md`, `CLAUDE.md`, `baretta.config.json`, `docs/` contextual y comentarios en español.

## Compatibilidad

Cada versión sale de un perfil centralizado (`compatibility/`) con versiones exactas; nunca `latest`. Cada combinación backend + auth tiene un estado (`verified`, `candidate`, `experimental`, `unsupported`) y el proyecto generado lo guarda en `baretta.config.json`.

## Requisitos

- Node.js **>= 22.12**
- npm, pnpm, yarn o bun (se detecta automáticamente)
