# AGENTS.md — test

Manual operativo para agentes de programación (Claude Code, Codex, Pi y similares).
Léelo completo antes de modificar código. Generado por Baretta Starter 1.0.0.

## 0. Reglas obligatorias para agentes

1. Antes de modificar código, lee este archivo, `baretta.config.json` y la documentación de `docs/` relevante para la tarea.
2. Nunca asumas el stack por nombres de archivos: la fuente de verdad es `baretta.config.json` y `package.json`.
3. Nunca inventes variables de entorno: solo existen las de `.env.example` (detalle en `docs/ENVIRONMENT.md`). Si necesitas una nueva, agrégala allí y documéntala.
4. Nunca modifiques archivos de infraestructura (`Dockerfile`, `docker-compose.yml`, `.github/`, `next.config.ts`, configuración de autenticación o base de datos) sin entender sus dependencias.
5. Nunca afirmes que un test, el typecheck o el build pasaron si no los ejecutaste en esta sesión. Reporta el resultado real, también cuando falla.
6. No agregues dependencias sin necesidad real. Las versiones están fijadas por el perfil de compatibilidad (`docs/COMPATIBILITY.md`): no actualices paquetes por tu cuenta.
7. Nunca expongas secretos: ninguna clave privada puede llevar el prefijo `NEXT_PUBLIC_` ni aparecer en código de cliente.

## 1. Descripción del proyecto

Aplicación web Next.js (App Router) creada con Baretta Starter. Perfil de compatibilidad: `stable` (2026.11.0), estado de la combinación: **verified**.

## 2. Stack seleccionado

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

## 3. Arquitectura

Capas, de afuera hacia adentro:

- `src/app/` — rutas de Next.js. Deben ser **delgadas**: validan la entrada, llaman a un servicio y devuelven la respuesta. No contienen reglas de negocio.
- `src/features/<dominio>/` — todo lo específico de un dominio (componentes, esquemas, acciones, hooks, tipos). Se consume solo mediante el `index.ts` de la feature.
- `src/services/` — lógica de negocio reutilizable. No conoce HTTP, formularios ni React.
- `src/lib/` — integraciones con sistemas externos (base de datos, autenticación, pagos, email...). Un archivo por integración.
- `src/components/` — UI compartida: `ui/` (primitivos), `layout/` (estructura), `shared/` (compuestos reutilizables).
- `src/config/` — configuración estática. `src/styles/` — CSS global y tokens de diseño.

Server Components por defecto. Usa `"use client"` solo cuando haga falta estado, efectos o APIs del navegador.

## 4. Estructura de carpetas

Detalle y ejemplos en `docs/ARCHITECTURE.md`. Mapa rápido:

```text
src/app/            rutas (App Router)
src/features/       dominios de negocio
src/services/       lógica de negocio reutilizable
src/lib/            integraciones externas
src/components/     UI compartida
docs/               documentación técnica (única ubicación de Markdown técnico)
```

## 5. Convenciones de código

- TypeScript estricto. Prohibido `any`; si es inevitable, justifícalo en un comentario.
- Alias de importación `@/` → `src/`.
- Nombres de archivos en `kebab-case`; componentes en `PascalCase`; funciones y variables en `camelCase`.
- Comentarios y documentación en español. Explica el *por qué*, no lo obvio.
- Estilos con Tailwind y los tokens de `src/styles/globals.css`. No hardcodees colores: usa `bg-background`, `text-muted`, `border-border`, etc.
- Evita archivos gigantes. Si un archivo supera ~200 líneas, evalúa dividirlo.

## 6. Reglas de seguridad

- Todo dato externo (formularios, query params, cuerpos de request, webhooks) se valida con **Zod** en el servidor. Ejemplo: `src/features/contact/schemas/contact-schema.ts`.
- Las Server Actions y Route Handlers son endpoints públicos: valida entrada y permisos siempre.
- Las variables secretas solo se leen en el servidor mediante `requireEnv` (`src/lib/env.ts`).
- No registres en logs datos personales, tokens ni claves.
- Detalle completo en `docs/SECURITY.md`.

## 7. Manejo de errores

- Usa `AppError` (`src/lib/errors.ts`) para errores esperados y `errorResponse` en Route Handlers.
- Los errores inesperados se registran en el servidor; el cliente recibe un mensaje genérico, nunca el stack.
- No uses `catch` vacíos ni tragues errores en silencio.

## 8. Validación de entradas

Cada borde de la aplicación (Server Action, Route Handler, webhook) define un esquema Zod y usa `safeParse`. Los tipos se derivan con `z.infer`; no los dupliques a mano.

## 9. Autenticación y autorización

Proveedor: **Clerk** (método: Solo Google). Guía completa y archivos clave en `docs/AUTHENTICATION.md`.

- Autenticación (quién eres) y autorización (qué puedes hacer) son cosas distintas: comprueba ambas **en el servidor** en cada operación sensible.
- Nunca confíes en datos del cliente (ids de usuario, roles, flags) para decidir permisos.
- Proteger una ruta en el proxy/middleware es una capa de conveniencia; la validación real va dentro del handler o la acción.

## 10. Reglas de base de datos

- Backend: **Convex**. No hay Prisma ni SQL: el esquema está en `convex/schema.ts` y la lógica en `convex/*.ts` (queries, mutations, actions).
- Toda función de Convex valida sus argumentos con `v` (validadores de Convex) y comprueba permisos adentro.
- Consulta `docs/DATABASE.md` antes de tocar el esquema.

## 11. Comandos disponibles

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

## 12. Cómo ejecutar tests

- Unitarios: `npm run test` (Vitest).
- End-to-end: `npm run test:e2e` (Playwright).
- Typecheck: `npm run typecheck`.

## 13. Cómo ejecutar el build

`npm run build`. Debe terminar sin errores antes de dar una tarea por cerrada.

## 14. Cómo agregar funcionalidades

1. Crea `src/features/<dominio>/` con solo las carpetas que necesites (`components`, `schemas`, `actions`, `hooks`, `types`) y un `index.ts` público.
2. Pon la lógica reutilizable en `src/services/` y las integraciones externas en `src/lib/`.
3. Mantén las rutas de `src/app/` delgadas.
4. Agrega tests para la lógica nueva.
5. Actualiza la documentación afectada (ver sección 15).

Si una feature es compleja (pagos, permisos...), crea un `AGENTS.md` local dentro de su carpeta con instrucciones específicas del dominio.

## 15. Cómo actualizar la documentación

- Todo Markdown técnico vive en `docs/`. Solo `README.md`, `AGENTS.md` y `CLAUDE.md` quedan en la raíz.
- Si cambias una variable de entorno → `.env.example` y `docs/ENVIRONMENT.md`.
- Si tomas una decisión arquitectónica → nuevo archivo en `docs/decisions/` (formato de `0001-initial-architecture.md`).
- Si cambias `baretta.config.json` a mano, deja constancia en una decisión: describe el estado real del proyecto.

## 16. Validar cambios antes de terminarlos

Ejecuta, en este orden, y reporta el resultado real de cada uno:

1. `npm run typecheck`
3. `npm run test`
4. `npm run build`

## 17. Notas específicas de los módulos instalados

- Base: las rutas viven en `src/app/`, la lógica en `src/services/` y las integraciones en `src/lib/`. Ejemplo completo de feature: `src/features/contact/`.
- Convex: esquema en `convex/schema.ts`, funciones en `convex/*.ts` (query, mutation, action). `convex/_generated/` lo regenera `convex dev` y se versiona. Guía completa: `docs/DATABASE.md`.
- Convex: toda función pública valida sus argumentos con `v` y comprueba permisos dentro de su handler; el cliente puede llamar cualquier función pública directamente, sin pasar por tus Server Actions.
- Convex: antes del primer `dev` real ejecuta `npx convex dev` para enlazar un deployment; así `.env.local` recibe `NEXT_PUBLIC_CONVEX_URL`.
- Clerk + Convex: `convex/auth.config.ts` declara a Clerk como emisor (variable `CLERK_JWT_ISSUER_DOMAIN` en el deployment de Convex) y el provider del navegador es `ConvexProviderWithClerk`. Autoriza dentro de cada función con `ctx.auth.getUserIdentity()` (ejemplo: `convex/viewer.ts`).
- Clerk: `src/proxy.ts` protege `/dashboard`; la autorización fina se verifica en el servidor (ver `src/app/(dashboard)/dashboard/page.tsx`). Los métodos de acceso se activan en el Dashboard de Clerk: ver `docs/AUTHENTICATION.md`.
- Clerk: usa `getSessionUserId()` de `src/lib/auth/session.ts` para obtener el usuario en el servidor; no leas la sesión del cliente para decidir permisos.
- Pagos: lee `src/features/payments/AGENTS.md` y `docs/PAYMENTS.md` antes de tocar cualquier archivo de `src/services/payments/` o del webhook. Un pago solo se aprueba tras consultar su estado a la API de Mercado Pago desde el webhook.
- Pagos: precios y productos/planes se definen SOLO en el servidor (`src/services/payments/catalog.ts`); el cliente envía un identificador, nunca un monto. Las reglas de negocio al aprobar un pago van en `src/services/payments/hooks.ts`.
- Pagos (Convex): las transacciones viven en la tabla `paymentTransactions` y las funciones de `convex/payments.ts` las protege el secreto `CONVEX_PAYMENTS_SECRET` (mismo valor en .env.local y en el deployment). Cada mutation es una transacción serializable, así que la idempotencia (crear/aprobar) es segura.
- Playwright: antes del primer `test:e2e` instala el navegador con el comando de `docs/extras/playwright.md`.
- Rate limit: usa `createRateLimiter()` y `enforceRateLimit()` de `src/lib/rate-limit/` en Route Handlers y Server Actions. En producción exige Upstash; el adaptador en memoria NO protege en serverless. Ejemplos en `docs/extras/rate-limit.md`.
- Resend: envía emails con `sendEmail({ to, subject, text, html? })` de `src/lib/email/send.ts` (solo servidor). Guía y verificación de dominio en `docs/extras/resend.md`.
- Vitest: pruebas en `tests/unit/**/*.test.ts`; `test` las ejecuta una vez y `test:watch` en modo interactivo. Ver `docs/extras/vitest.md`.
- Deploy: Vercel y Docker no comparten configuración operativa. Toda variable `NEXT_PUBLIC_*` nueva debe declararse en el módulo correspondiente (el Dockerfile genera sus `ARG` desde esa lista). Ver `docs/DEPLOYMENT.md`.
