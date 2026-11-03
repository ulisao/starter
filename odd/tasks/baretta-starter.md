# Baretta Starter — generador Next.js modular
Objetivo: CLI `baretta create` que compone proyectos Next.js verificados. Rama: main. Entrega: commits por unidad. Runner: node:test (CLI) + tsc/build (proyectos generados).

## Specs
- S1 Wizard `npx baretta create` con prompts condicionales y resumen antes de escribir.
- S2 Backend: Convex (sin Prisma) | Supabase (Prisma) | PostgreSQL propio (Prisma).
- S3 Auth: Clerk | Supabase Auth | Better Auth | Convex Auth | ninguna; métodos validados por proveedor.
- S4 Pagos Mercado Pago (pago único / suscripción) solo si se piden.
- S5 Deploy Vercel + Docker siempre; extras condicionales.
- S6 Estructura pro-IA: AGENTS.md, CLAUDE.md, docs/, baretta.config.json; comentarios y docs en español.
- S7 Compatibilidad centralizada (perfil stable, estados verified/candidate/experimental/unsupported); nunca `latest`.
- S8 Tests del generador + matriz; proyectos generados pasan install/tsc/build; `npm pack`; ZIP.

## Tasks
- T1 Núcleo (config, compat, plantillas, generador, CLI) — inline
- T2 Base Next.js + backend postgres + sin auth validado — inline
- T3 Capas restantes (convex, supabase, auth, pagos, extras, deploy) — delegated (writers paralelos)
- T4 Docs del repo, tests matriz, validación, pack, ZIP — inline

## Log
L1 (2026-11-03): ver prompt original "MASTER PROMPT — BARETTA STARTER" (construir producto completo, español en comentarios/docs, compatibilidad antes que actualidad).
L2: perfil stable: prisma 7.10.1 (latest=8.0.0-rc), TS 5.9.3 (latest=7.x), better-auth 1.6.34 con Convex (peer <1.7), Node >=22.12.
L3: T1/T2 completados inline (commits c1f2f3f..). postgres+none verified (install/tsc/build). T3 delegado por paralelismo (8 unidades con superficies disjuntas, brief en odd/writer-brief.md): U1 convex+convex-auth, U2 clerk, U3 supabase+supabase-auth, U4 better-auth(prisma), U5 mercadopago(prisma), U6 extras dev, U7a resend/sentry/rate-limit/analytics, U7b ai/storage.
L4 (fase 2 pendiente tras T3): convex+clerk, convex+better-auth (@convex-dev/better-auth, better-auth 1.6.34), supabase+clerk, supabase+better-auth, pagos sobre convex, resend en better-auth/convex-auth, storage convex/supabase; matriz completa, ZIP.

## Estado al cierre de sesión 1 (2026-11-03)
T3 fase 1 COMPLETA (8 unidades). Verificado con install+tsc+build real:
- postgres+none, postgres+clerk(5 métodos), postgres+better-auth(5), supabase+none, supabase+supabase-auth(5), convex+none, MercadoPago(one-time y subscription, sobre postgres+none), extras dev (biome,vitest,playwright,CI,docker; npm), ai+storage-s3, resend+sentry+rate-limit+analytics (U7a: corregido por mí `sendDefaultPii`; sin reporte final del agente, fichas aún candidate).
- convex+convex-auth: experimental (tsc+build ok, OTP probado en vivo con backend local).
No verificado nunca contra servicios reales: Google OAuth, Mercado Pago API, Resend, Sentry DSN, Supabase real. Docker no instalado en la máquina (compose sin `config`).

## FASE 2 — pendiente (en este orden)
1. Núcleo: (a) pnpm falla ERR_PNPM_IGNORED_BUILDS -> generar allowBuilds (pnpm-workspace.yaml o campo package.json vía hook packageJson) para prisma/@prisma/engines/esbuild; ojo npm 11 también avisa install-scripts; (b) header base sin link a /login (slot de navegación o enlace con hasAuth); (c) yarn: commandsFor usa `yarn dlx`/`--frozen-lockfile` (inconsistente Classic vs Berry); (d) Biome: formatear plantillas base para que `lint` pueda volver a `biome check` (hoy `biome lint`); (e) env con target (variables de deployment Convex vs .env.local) opcional.
2. Combinaciones sin implementar: convex+clerk, convex+better-auth (@convex-dev/better-auth, better-auth 1.6.34), supabase+clerk, supabase+better-auth (validar), pagos sobre Convex (tablas vía slots convexSchemaTables), storage supabase/convex (revalidar; riesgo variable NEXT_PUBLIC_SUPABASE_URL duplicada), Resend en better-auth/convex-auth.
3. Escribir scripts/validate-matrix.mjs (referenciado en package.json y docs; NO existe aún) con env falsas por proveedor (Clerk: pk_test_Y2xlcmsuZXhhbXBsZS5jb20k / sk_test_<alfanum>; Supabase URL https://abcdefgh.supabase.co + PUBLISHABLE_KEY; Convex NEXT_PUBLIC_CONVEX_URL=https://example-123.convex.cloud; BETTER_AUTH_SECRET; ver reportes en cada módulo).
4. Correr matriz completa con --record, revisar fichas candidate (U7a), `npm test` (integration test escrito, no corrido con todos los módulos), tests de signature de MP (función pura src/lib/payments/signature.ts, sin test commiteado).
5. examples/ (vacío), README estado del proyecto + tabla verified/experimental/pendientes, packages/cli/README.md, .github/workflows/ci.yml del repo, `npm run pack:cli` final, `npm run zip` (scripts/make-zip.mjs usa git ls-files; commitear antes). No publicar en npm (nombre `baretta` libre al 2026-11-03).
Notas: validar con scripts/validate-project.mjs (workdir C:/Users/PC/bs-work, install tarda 1-6 min). Bash heredocs largos fallan en esta máquina: usar Write. `python -` heredoc se cuelga.
