# test

Proyecto Next.js generado con **Baretta Starter** (Estudio Baretta).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript estricto
- Tailwind CSS 4 con tokens de diseño en variables CSS
- Zod para validación de entradas
- Convex (backend gestionado: base de datos reactiva, queries/mutations/actions en TypeScript)
- Integración Clerk ↔ Convex: Convex valida los tokens de Clerk y las funciones leen `ctx.auth.getUserIdentity()`
- Clerk (autenticación, `@clerk/nextjs`) con `proxy.ts` y componentes oficiales
- Mercado Pago (SDK oficial `mercadopago`) con webhook de firma verificada
- Pagos: registro de transacciones en Convex (`paymentTransactions`, funciones en `convex/payments.ts`)
- Playwright (pruebas e2e en `tests/e2e/`)
- Rate limiting con Upstash Redis (`@upstash/ratelimit`)
- Resend (emails transaccionales)
- Vitest (pruebas unitarias en `tests/unit/`)
- Despliegue preparado para Vercel y Docker (multi-stage, usuario no root)

## Empezar

```bash
npm install
cp .env.example .env.local   # completa los valores: ver docs/ENVIRONMENT.md
npm run dev
```

Node.js requerido: `>=22.12.0`. La aplicación queda en http://localhost:3000.

## Scripts

- `npm run dev` → `next dev`
- `npm run build` → `next build`
- `npm run start` → `next start`
- `npm run typecheck` → `tsc --noEmit`
- `npm run convex:dev` → `convex dev`
- `npm run convex:deploy` → `convex deploy`
- `npm run convex:codegen` → `convex codegen`
- `npm run test:e2e` → `playwright test`
- `npm run test` → `vitest run`
- `npm run test:watch` → `vitest`

## Documentación

Toda la documentación técnica está en `docs/`:

| Documento | Contenido |
| --- | --- |
| `docs/ARCHITECTURE.md` | Estructura y convenciones |
| `docs/ENVIRONMENT.md` | Variables de entorno |
| `docs/API.md` | Rutas y Server Actions |
| `docs/SECURITY.md` | Reglas de seguridad |
| `docs/TESTING.md` | Estrategia de tests |
| `docs/DEPLOYMENT.md` | Vercel y Docker |
| `docs/COMPATIBILITY.md` | Versiones fijadas y estado de verificación |
| `docs/EXTRAS.md` | Extras instalados |
| `docs/DATABASE.md` | Convex: esquema y funciones |
| `docs/AUTHENTICATION.md` | Configuración de Clerk |
| `docs/PAYMENTS.md` | Mercado Pago |

## Trabajar con agentes de IA

`AGENTS.md` y `CLAUDE.md` contienen las reglas que cualquier agente debe seguir. `baretta.config.json` registra las decisiones con las que se generó el proyecto.
