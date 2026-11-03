# Base de datos: PostgreSQL + Prisma

## Propósito

Explica cómo conectar la base de datos, cambiar el esquema y operar migraciones.

## Arquitectura

- Motor: PostgreSQL administrado por ti (local o remoto).
- ORM: Prisma 7 con driver adapter `@prisma/adapter-pg`.
- Esquema: `prisma/schema/` (varios archivos `.prisma`; los modelos de la aplicación están en `app.prisma`).
- Cliente: `getPrisma()` en `src/lib/database/prisma.ts`. Es el único lugar donde se instancia `PrismaClient`.
- Configuración de la CLI: `prisma.config.ts` (carga `.env.local` y `.env`).

## Conectar una base local (Docker)

```bash
docker compose up -d db          # levanta PostgreSQL 17 en el puerto 5432
cp .env.example .env.local       # DATABASE_URL ya apunta a esta base
<%= runCmd %> db:migrate -- --name init
```

## Conectar una base remota

Reemplaza `DATABASE_URL` en `.env.local` (o en las variables del hosting) con la cadena de tu proveedor, normalmente con `?sslmode=require`. Después ejecuta `<%= runCmd %> db:deploy` para aplicar las migraciones existentes.

## Comandos

| Comando | Uso |
| --- | --- |
| `<%= runCmd %> db:generate` | Regenera el cliente (se ejecuta solo tras instalar) |
| `<%= runCmd %> db:migrate -- --name x` | Crea y aplica una migración en desarrollo |
| `<%= runCmd %> db:deploy` | Aplica migraciones pendientes (producción/CI) |
| `<%= runCmd %> db:seed` | Ejecuta `prisma/seed.ts` |
| `<%= runCmd %> db:studio` | Interfaz visual de datos |

## Flujo de cambios de esquema

1. Edita `prisma/schema/*.prisma`.
2. `<%= runCmd %> db:migrate -- --name descripcion`.
3. Revisa la migración generada en `prisma/migrations/` y súbela al repositorio.
4. En producción: `<%= runCmd %> db:deploy` (nunca `db:migrate`).

## Errores frecuentes

- *Falta la variable DATABASE_URL*: copia `.env.example` a `.env.local`.
- *P1001 no se puede conectar*: la base no está levantada o la URL es incorrecta.
- *Cannot find module '@/generated/prisma/client'*: ejecuta `<%= runCmd %> db:generate`.
