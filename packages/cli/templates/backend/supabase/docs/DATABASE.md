# Base de datos: Supabase (PostgreSQL) + Prisma

## Propósito

Explica cómo conectar la base de datos de Supabase, cambiar el esquema con Prisma y qué debes tener en cuenta de la seguridad (RLS) y de las conexiones.

## Arquitectura

- Motor: PostgreSQL gestionado por Supabase.
- ORM: Prisma 7 con driver adapter `@prisma/adapter-pg`. **Toda** consulta de la aplicación pasa por `getPrisma()` (`src/lib/database/prisma.ts`).
- Esquema: `prisma/schema/` (varios archivos `.prisma`; los modelos de la aplicación están en `app.prisma`).
- Configuración de la CLI de Prisma: `prisma.config.ts` (carga `.env.local` y `.env`; usa `DIRECT_URL` para migraciones).

### Supabase como backend y Supabase Auth son decisiones separadas

<%#if isSupabaseAuth%>
En este proyecto elegiste **ambas**: la base de datos de Supabase y Supabase Auth. Aun así son piezas independientes: la aplicación lee y escribe datos con Prisma (conexión directa a Postgres, con el rol `postgres`), y los usuarios se gestionan con `@supabase/ssr` (ver `docs/AUTHENTICATION.md`). Los usuarios viven en el esquema `auth` de Supabase; relaciona tus tablas con ellos guardando el `id` (UUID) que devuelve `getSessionUserId()` en una columna propia, por ejemplo `userId String @db.Uuid`. No declares claves foráneas hacia `auth.users` desde Prisma (el esquema `auth` lo administra Supabase).
<%#else%>
En este proyecto elegiste Supabase **solo como base de datos**. No hay Supabase Auth ni cliente `@supabase/supabase-js`: la aplicación habla con Postgres únicamente a través de Prisma. Si más adelante necesitas Supabase Auth, Storage o Realtime, se agregan aparte (instala `@supabase/ssr` y `@supabase/supabase-js` con las versiones de `docs/COMPATIBILITY.md` y sigue la documentación oficial de Supabase).
<%#endif%>

## Dos cadenas de conexión: pooled y directa

| Variable | Puerto | Se usa para | Por qué |
| --- | --- | --- | --- |
| `DATABASE_URL` | 6543 (pooler, modo transaction) | La aplicación en runtime (`getPrisma()`) | En serverless (Vercel) cada invocación abre una conexión corta; el pooler evita agotar el límite de conexiones de Postgres. |
| `DIRECT_URL` | 5432 (conexión directa) | Solo migraciones de Prisma (`db:migrate`, `db:deploy`) | El pooler en modo transaction no soporta las operaciones que usan las migraciones (bloqueos de sesión, DDL en transacciones largas). |

Cómo obtenerlas:

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) y abre tu proyecto.
2. Pulsa **Connect** (arriba en la barra del proyecto).
3. Copia **Transaction pooler** → `DATABASE_URL`.
4. Copia **Direct connection** → `DIRECT_URL`. Si tu red solo tiene IPv4, usa en su lugar **Session pooler** (puerto 5432 del pooler): la conexión directa de Supabase es IPv6.
5. Sustituye `[YOUR-PASSWORD]` por la contraseña de la base (*Project Settings → Database → Reset database password* si la perdiste). Si contiene caracteres especiales, codifícalos como URL (`@` → `%40`).

Pégalas en `.env.local`. En Vercel/Docker cárgalas como variables de entorno del entorno de ejecución (ver `docs/DEPLOYMENT.md`); `DIRECT_URL` también debe estar disponible donde ejecutes `db:deploy`.

## Comandos

| Comando | Uso |
| --- | --- |
| `<%= runCmd %> db:generate` | Regenera el cliente (se ejecuta solo tras instalar) |
| `<%= runCmd %> db:migrate -- --name x` | Crea y aplica una migración en desarrollo (usa `DIRECT_URL`) |
| `<%= runCmd %> db:deploy` | Aplica migraciones pendientes (producción/CI, usa `DIRECT_URL`) |
| `<%= runCmd %> db:seed` | Ejecuta `prisma/seed.ts` |
| `<%= runCmd %> db:studio` | Interfaz visual de datos |

## Migraciones

1. Edita `prisma/schema/*.prisma`.
2. `<%= runCmd %> db:migrate -- --name descripcion`.
3. Revisa la migración generada en `prisma/migrations/` y súbela al repositorio.
4. En producción: `<%= runCmd %> db:deploy` (nunca `db:migrate`).

Primera vez en un proyecto nuevo: `<%= runCmd %> db:migrate -- --name init`. Si la base ya tiene tablas creadas desde el editor SQL de Supabase, no uses `db:migrate` sobre ellas sin antes alinear el historial (`prisma migrate baseline`/`db pull` según la documentación de Prisma): no edites el esquema a mano desde el dashboard, porque Prisma deja de ser la fuente de verdad.

## Seed

`<%= runCmd %> db:seed` ejecuta `prisma/seed.ts` contra `DIRECT_URL`. Hazlo idempotente (`upsert`) y nunca lo ejecutes contra producción con datos de prueba.

## Seguridad: RLS (Row Level Security)

Supabase expone automáticamente una API REST/GraphQL (PostgREST) sobre las tablas del esquema `public`, accesible con la clave pública (publishable/anon). Eso es independiente de Prisma:

- Prisma se conecta como rol `postgres` y **ignora RLS**. Tu autorización va en el servidor (servicios y Server Actions), nunca confíes en el cliente.
- Una tabla creada por Prisma en `public` **sin RLS habilitada** queda legible/escribible por la API pública de Supabase para cualquiera que tenga la clave publishable. Para tablas que solo usa tu servidor, habilita RLS **sin crear políticas**: así la API pública no puede acceder y Prisma sigue funcionando.
  - Añádelo en la propia migración: `ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;` (edita el SQL de la migración antes de aplicarla con `--create-only`).
- Si decides usar la API de Supabase desde el navegador, escribe políticas explícitas por tabla y pruébalas; no desactives RLS "para que funcione".

Qué NO hacer:

- No uses la clave `service_role`/secret en código de cliente ni con prefijo `NEXT_PUBLIC_`: salta todas las políticas RLS.
- No pongas `DATABASE_URL` ni `DIRECT_URL` en variables `NEXT_PUBLIC_`.
- No ejecutes `prisma migrate reset` ni `db push --force-reset` contra la base de producción: borran datos.
- No cambies el esquema a mano en el dashboard sin reflejarlo en una migración.

## Errores frecuentes

- *Falta la variable DATABASE_URL*: copia `.env.example` a `.env.local` y complétala.
- *P1001 / P1017 no se puede conectar*: contraseña mal codificada, proyecto pausado (los proyectos gratuitos se pausan por inactividad: reanúdalo en el dashboard) o red solo IPv4 con la conexión directa.
- *Migraciones que se quedan colgadas*: se están ejecutando contra el pooler; usa `DIRECT_URL`.
- *Cannot find module '@/generated/prisma/client'*: ejecuta `<%= runCmd %> db:generate`.
