# Ejemplos

Invocaciones no interactivas de `baretta create` para escenarios comunes. Cada una genera un
proyecto completo sin preguntar nada (`--yes`) y sin instalar dependencias (`--install skip`);
quitá esas banderas para el asistente interactivo o para instalar al generar.

Todas estas combinaciones están `verified` (salvo donde se indique): se generó un proyecto real
que pasó `install`, `typecheck` y `build`. Ver el estado vigente con `baretta compatibility`.

## SaaS con Convex + Clerk + suscripciones

Backend reactivo, autenticación gestionada y cobros recurrentes. Clerk valida los tokens dentro de
Convex y Mercado Pago gestiona la suscripción.

```bash
baretta create mi-saas \
  --backend convex --auth clerk --auth-method google \
  --payments subscription \
  --extras resend,sentry,analytics,rate-limit \
  --pm pnpm --install skip --yes
```

## App full-TypeScript con Convex + Better Auth

Autenticación con Better Auth corriendo dentro de Convex (`@convex-dev/better-auth`), sin base de
datos aparte.

```bash
baretta create mi-app \
  --backend convex --auth better-auth --auth-method password-google \
  --payments one-time \
  --extras biome,vitest,storage \
  --pm pnpm --install skip --yes
```

## Producto sobre PostgreSQL propio + Better Auth + pago único

Base de datos propia con Prisma, sesiones en la base y checkout de pago único.

```bash
baretta create mi-producto \
  --backend postgres --auth better-auth --auth-method password-google \
  --payments one-time \
  --extras biome,vitest,playwright,github-actions,docker \
  --pm npm --install skip --yes
```

## Supabase + Supabase Auth

Backend y autenticación de Supabase (Prisma sobre la base de Supabase para tus propios modelos).

```bash
baretta create mi-supabase \
  --backend supabase --auth supabase-auth --auth-method magic-link \
  --extras resend,ai \
  --pm pnpm --install skip --yes
```

## Prototipo mínimo sin autenticación

```bash
baretta create prototipo \
  --backend convex --auth none \
  --pm bun --install skip --yes
```

## Convex Auth (experimental)

Autenticación nativa de Convex (`@convex-dev/auth`). Funciona pero está marcada `experimental`:
revisá `baretta compatibility` antes de usarla en producción.

```bash
baretta create mi-convex-auth \
  --backend convex --auth convex-auth --auth-method otp \
  --pm pnpm --install skip --yes
```
