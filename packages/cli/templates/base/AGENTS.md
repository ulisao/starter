# AGENTS.md — <%= name %>

Manual operativo para agentes de programación (Claude Code, Codex, Pi y similares).
Léelo completo antes de modificar código. Generado por Baretta Starter <%= starterVersion %>.

## 0. Reglas obligatorias para agentes

1. Antes de modificar código, lee este archivo, `baretta.config.json` y la documentación de `docs/` relevante para la tarea.
2. Nunca asumas el stack por nombres de archivos: la fuente de verdad es `baretta.config.json` y `package.json`.
3. Nunca inventes variables de entorno: solo existen las de `.env.example` (detalle en `docs/ENVIRONMENT.md`). Si necesitas una nueva, agrégala allí y documéntala.
4. Nunca modifiques archivos de infraestructura (`Dockerfile`, `docker-compose.yml`, `.github/`, `next.config.ts`, configuración de autenticación o base de datos) sin entender sus dependencias.
5. Nunca afirmes que un test, el typecheck o el build pasaron si no los ejecutaste en esta sesión. Reporta el resultado real, también cuando falla.
6. No agregues dependencias sin necesidad real. Las versiones están fijadas por el perfil de compatibilidad (`docs/COMPATIBILITY.md`): no actualices paquetes por tu cuenta.
7. Nunca expongas secretos: ninguna clave privada puede llevar el prefijo `NEXT_PUBLIC_` ni aparecer en código de cliente.

## 1. Descripción del proyecto

Aplicación web Next.js (App Router) creada con Baretta Starter. Perfil de compatibilidad: `<%= profileName %>` (<%= profileVersion %>), estado de la combinación: **<%= compatStatus %>**.

## 2. Stack seleccionado

<%= stackList %>

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

<%#if hasAuth%>
Proveedor: **<%= authLabel %>** (método: <%= authMethodLabel %>). Guía completa y archivos clave en `docs/AUTHENTICATION.md`.

- Autenticación (quién eres) y autorización (qué puedes hacer) son cosas distintas: comprueba ambas **en el servidor** en cada operación sensible.
- Nunca confíes en datos del cliente (ids de usuario, roles, flags) para decidir permisos.
- Proteger una ruta en el proxy/middleware es una capa de conveniencia; la validación real va dentro del handler o la acción.
<%#else%>
Este proyecto se generó **sin autenticación**. No hay usuarios ni sesiones. Si necesitas agregarla, no improvises: consulta `docs/AUTHENTICATION.md` y vuelve a generar o integra un proveedor siguiendo su documentación oficial.
<%#endif%>

## 10. Reglas de base de datos

<%#if hasPrisma%>
- ORM: **Prisma 7** sobre PostgreSQL (<%= backendLabel %>). El esquema vive en `prisma/schema.prisma`.
- Todo cambio de esquema pasa por una migración: `<%= runCmd %> db:migrate`. Nunca edites la base a mano.
- Cliente único en `src/lib/database/prisma.ts`; no instancies `PrismaClient` en otro lado.
- Consulta `docs/DATABASE.md` antes de tocar el esquema.
<%#else%>
- Backend: **Convex**. No hay Prisma ni SQL: el esquema está en `convex/schema.ts` y la lógica en `convex/*.ts` (queries, mutations, actions).
- Toda función de Convex valida sus argumentos con `v` (validadores de Convex) y comprueba permisos adentro.
- Consulta `docs/DATABASE.md` antes de tocar el esquema.
<%#endif%>

## 11. Comandos disponibles

<%= scriptsList %>

## 12. Cómo ejecutar tests

<%#if hasVitest%>
- Unitarios: `<%= runCmd %> test` (Vitest).
<%#endif%>
<%#if hasPlaywright%>
- End-to-end: `<%= runCmd %> test:e2e` (Playwright).
<%#endif%>
- Typecheck: `<%= runCmd %> typecheck`.
<%#if !hasVitest%>
Este proyecto no incluye Vitest ni Playwright. Si agregas tests, documenta el comando en `docs/TESTING.md`.
<%#endif%>

## 13. Cómo ejecutar el build

`<%= runCmd %> build`. Debe terminar sin errores antes de dar una tarea por cerrada.

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

1. `<%= runCmd %> typecheck`
<%#if hasBiome%>
2. `<%= runCmd %> lint`
<%#endif%>
<%#if hasVitest%>
3. `<%= runCmd %> test`
<%#endif%>
4. `<%= runCmd %> build`

## 17. Notas específicas de los módulos instalados

<%= moduleNotes %>
