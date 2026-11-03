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
