# Baretta Starter

Generador modular de proyectos **Next.js** de **Estudio Baretta**, optimizado para trabajar con agentes de IA (Claude Code, Codex, Pi y similares).

```bash
npx baretta create
```

Respondés unas preguntas y obtenés un proyecto Next.js configurado: backend, autenticación, pagos, extras y despliegue, con una combinación de versiones **que funciona en conjunto** (no la última versión de cada paquete).

> **Estado:** ver [Estado del proyecto](#estado-del-proyecto). El paquete **no está publicado en npm**: hoy se usa desde este repositorio (ver [Instalación](#instalación-para-desarrollo)).

## Características

- **Next.js 16** (App Router) + React 19 + TypeScript estricto + Tailwind CSS 4.
- **Backend** a elección: Convex (nativo, sin Prisma), Supabase (+ Prisma) o PostgreSQL propio (+ Prisma 7).
- **Autenticación**: Clerk, Supabase Auth, Better Auth, Convex Auth (experimental) o ninguna; métodos: email + contraseña, + Google, solo Google, magic link, OTP por email. Las combinaciones inválidas se rechazan con el motivo.
- **Pagos** opcionales con **Mercado Pago**: pago único o suscripción, webhooks verificados, idempotencia.
- **Despliegue** preparado para **Vercel y Docker** (multi-stage, usuario no root).
- **Extras**: Resend, Sentry, Docker (dev), Biome, Vitest, Playwright, GitHub Actions, Storage, IA (OpenAI / Anthropic), Rate limiting, Analytics.
- **Estructura pro-IA**: `AGENTS.md`, `CLAUDE.md`, `baretta.config.json`, `docs/` contextual y comentarios extensos en español.
- **Compatibilidad centralizada**: perfiles con versiones exactas y estado por combinación (`verified`, `candidate`, `experimental`, `unsupported`). Nunca `latest`.
- Package manager detectado automáticamente: npm, pnpm, yarn o bun.

## Requisitos

- Node.js **>= 22.12**
- npm, pnpm, yarn o bun

## Uso

```bash
# Asistente interactivo
npx baretta create

# No interactivo
npx baretta create mi-app --backend postgres --auth better-auth --auth-method password-google \
  --payments none --extras biome,vitest --pm pnpm --install skip --yes

# Ver perfil de compatibilidad y estado de cada combinación
npx baretta compatibility
```

Opciones de `create`: `--backend`, `--auth`, `--auth-method`, `--payments`, `--extras`, `--pm`, `--install`, `--dir`, `--yes`. Detalle con `baretta create --help`.

Antes de escribir archivos se muestra un resumen de la configuración y el estado de compatibilidad, y se pide confirmación. Si la instalación de dependencias falla, el proyecto se conserva.

## Estado del proyecto

Cada combinación de backend + autenticación tiene un estado de compatibilidad. `verified` significa que se generó un proyecto real y pasó `install` + `typecheck` + `build` (y `lint`/`test` cuando aplica) con la última ejecución de `npm run matrix`. Consultá el estado vigente con `npx baretta compatibility`.

| Backend | Sin auth | Clerk | Supabase Auth | Better Auth | Convex Auth |
| --- | --- | --- | --- | --- | --- |
| **PostgreSQL** | ✅ verified | ✅ verified | — | ✅ verified | — |
| **Supabase** | ✅ verified | ✅ verified | ✅ verified | ✅ verified | — |
| **Convex** | ✅ verified | ✅ verified | — | ✅ verified | 🧪 experimental |

- **Pagos (Mercado Pago)**: pago único y suscripción verificados sobre los tres backends. En Convex la persistencia vive en `convex/payments.ts` / `convex/paymentsSubscriptions.ts` (tablas `paymentTransactions` y `paymentSubscriptions`), protegidas por `CONVEX_PAYMENTS_SECRET`.
- **Clerk ↔ Convex** y **Better Auth ↔ Convex** (`@convex-dev/better-auth`, `better-auth` fijado en 1.6.x) están integrados y verificados.
- **Extras** (Resend, Sentry, Docker, Biome, Vitest, Playwright, GitHub Actions, Storage, IA, Rate limiting, Analytics) verificados en conjunto sobre PostgreSQL.
- **Nunca verificado contra servicios reales** (solo credenciales de formato válido en el build): OAuth de Google, API de Mercado Pago, Resend, Sentry, Supabase y Convex en vivo. La verificación cubre generación, tipos y build, no el comportamiento end-to-end con cada proveedor.

## Instalación para desarrollo

```bash
git clone <este repositorio> && cd baretta-starter
cd packages/cli && npm install && npm link
baretta create
```

## Estructura del repositorio

```text
packages/cli/       El CLI (paquete npm "baretta")
  src/              Núcleo, comandos y módulos
  templates/        Plantillas por capa
  compatibility/    Perfiles, fichas de paquetes y combinaciones
  tests/            Tests unitarios y de integración
docs/               Documentación del generador
scripts/            validate-project, validate-matrix, pack, make-zip
examples/           Proyectos de ejemplo (configuraciones)
```

## Documentación

| Documento | Contenido |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Cómo funciona el generador |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Desarrollar y probar el CLI |
| [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) | Selección, verificación y actualización de versiones |
| [docs/TEMPLATES.md](docs/TEMPLATES.md) | Agregar backends, auth, métodos, extras y perfiles |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Convenciones |
| [docs/RELEASE.md](docs/RELEASE.md) | Empaquetar y publicar |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisiones arquitectónicas |

## Tecnologías del CLI

Node.js (ESM, sin paso de build), `@clack/prompts` como única dependencia, `node:test` para los tests.
