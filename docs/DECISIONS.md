# Decisiones arquitectónicas

Registro de decisiones importantes del generador. Formato: contexto, decisión, consecuencias.

## D1 — Módulos descubiertos por convención, sin registro central

- **Contexto**: la especificación exige poder agregar backends, proveedores y extras sin reescribir el CLI.
- **Decisión**: todo `src/modules/<capa>/*.js` se carga automáticamente y declara `when`, plantillas, dependencias y env.
- **Consecuencias**: agregar una tecnología es agregar archivos; el núcleo no cambia. Los conflictos se detectan al generar.

## D2 — Sintaxis de plantillas propia (`<%= %>`, `<%#if%>`)

- **Contexto**: `{{ }}` aparece en JSX y GitHub Actions.
- **Decisión**: delimitadores `<%` y directivas en línea propia; motor de ~60 líneas sin dependencias.
- **Consecuencias**: sin dependencia de un motor externo; las plantillas siguen siendo legibles y los errores (variable/flag desconocido) son explícitos.

## D3 — Compatibilidad en JSON por paquete y por combinación

- **Contexto**: las versiones no pueden estar dispersas ni depender de `latest`.
- **Decisión**: perfiles con una ficha por paquete (`versión`, `estado`, `fuentes`) y combinaciones con `overrides`; el estado global es el peor de los componentes.
- **Consecuencias**: se actualizan versiones sin tocar código; `verified` solo se escribe con `validate-project --record`.

## D4 — Perfil `stable`: Prisma 7.10.1 y TypeScript 5.9.3

- **Contexto**: a 2026-11-03 el dist-tag `latest` de `prisma` es `8.0.0-rc.30` y el de `typescript` es 7.x.
- **Decisión**: no seguir `latest`; fijar Prisma 7.10.1 (peers de Better Auth admiten `^7`) y TypeScript 5.9.3 (Prisma exige `>=5.4`).
- **Consecuencias**: se revisa con cada actualización del perfil.

## D5 — Better Auth 1.6.x con Convex

- **Contexto**: `@convex-dev/better-auth@0.12.7` declara el peer `better-auth >=1.6.11 <1.7.0`.
- **Decisión**: la combinación Convex + Better Auth fija 1.6.34 mediante `overrides`; el resto usa 1.7.15.
- **Consecuencias**: evita un conflicto de peers que rompería la instalación.

## D6 — Node >= 22.12

- **Contexto**: Convex exige Node >=22 y Vitest 5 exige ^22.12.
- **Decisión**: el perfil exige `>=22.12.0` para todos los proyectos (uniforme y simple).
- **Consecuencias**: no se soporta Node 20.

## D7 — Next.js 16: `proxy.ts` y esquema Prisma multi-archivo

- **Decisión**: la protección de rutas usa `proxy.ts` (reemplaza a `middleware.ts` en Next 16). Prisma usa `prisma/schema/*.prisma` para que auth y pagos aporten modelos sin editar el mismo archivo.

## D8 — Providers y slots en vez de sobrescribir archivos compartidos

- **Decisión**: `src/components/providers.tsx` y puntos como `next.config.ts` se componen a partir de datos declarados por los módulos.
- **Consecuencias**: varios módulos pueden coexistir (Clerk + Convex + Sentry) sin pisarse.

## D9 — Docker Compose siempre presente; el extra "docker" añade herramientas de desarrollo

- **Decisión**: el despliegue Docker (Dockerfile, compose de tipo producción) se genera siempre; el extra `docker` solo agrega `docker-compose.dev.yml` y scripts.

## D10 — Variables `NEXT_PUBLIC_*` como argumentos de build en Docker

- **Contexto**: se incrustan en el JS durante `next build`.
- **Decisión**: el Dockerfile y el compose derivan sus `ARG` de las variables públicas declaradas por los módulos.

## D11 — Funcionalidades multi-backend: capa común + persistencia por backend

- **Contexto**: Better Auth y Mercado Pago valen para cualquier backend, pero su almacenamiento cambia (Prisma vs Convex).
- **Decisión**: partir en una capa común agnóstica (UI, SDK, webhook, catálogo) más módulos de persistencia (`prisma`/`convex`) que exponen el mismo contrato de servicios (`getSessionUserId()`, `createCheckout()`, `applyPaymentState()`, ...).
- **Consecuencias**: la capa común no sabe dónde se guardan los datos; agregar un backend a una funcionalidad es agregar una persistencia, no duplicarla. Ver `docs/TEMPLATES.md`.

## D12 — Persistencia de pagos en Convex: mutations serializables + secreto compartido

- **Contexto**: Convex no tiene restricciones únicas ni el `updateMany` condicional de Prisma, y sus funciones públicas puede invocarlas cualquiera.
- **Decisión**: la idempotencia (crear transacción por `idempotencyKey`, aprobar una sola vez) se resuelve dentro de una mutation, que en Convex es una transacción serializable (leer-comparar-escribir es atómico). Las funciones de `convex/payments.ts` se protegen con el secreto compartido `CONVEX_PAYMENTS_SECRET` (mismo patrón que el storage de Convex), definido en `.env.local` y en el deployment.
- **Consecuencias**: equivalencia de garantías con la versión Prisma sin claves únicas; el secreto es obligatorio para que el servidor de Next.js llame a esas funciones.

## D13 — Comandos `doctor` y `update` sobre `baretta.config.json`

- **Contexto**: un proyecto generado se desactualiza respecto del perfil (versiones cambiadas a mano, nuevas versiones en el perfil).
- **Decisión**: `baretta.config.json` guarda la configuración con la que se generó; `doctor` re-planifica con el mismo perfil y contrasta (diagnostica), y `update` reconcilia solo las versiones gestionadas por el perfil y los metadatos, sin tocar código, scripts ni dependencias agregadas a mano. Ninguno instala ni accede a la red.
- **Consecuencias**: el ciclo de vida posterior a la generación no exige volver a correr el wizard; `computeUpdate()`/`diagnose()` son puros y testeables.
