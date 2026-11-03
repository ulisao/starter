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
