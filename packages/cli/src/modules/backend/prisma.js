// Módulo Prisma: ORM compartido por los backends PostgreSQL propio y Supabase.
// Convex NO usa este módulo (tiene modelo de datos nativo).

import { usesPrisma } from '../../core/configuration/schema.js';

export default {
  id: 'orm-prisma',
  when: usesPrisma,
  templates: 'backend/prisma',
  // Reemplaza al servicio de contacto base para persistir en la base de datos.
  overrides: ['src/services/contact-service.ts'],
  dependencies: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  devDependencies: ['prisma', 'tsx', 'dotenv', '@types/pg'],
  // Scripts de instalación que pnpm debe permitir (prisma descarga motores; esbuild lo usa tsx).
  allowBuilds: ['prisma', '@prisma/engines', 'esbuild'],
  scripts: {
    postinstall: 'prisma generate',
    'db:generate': 'prisma generate',
    'db:migrate': 'prisma migrate dev',
    'db:deploy': 'prisma migrate deploy',
    'db:seed': 'prisma db seed',
    'db:studio': 'prisma studio',
  },
  env: (cfg) => [
    {
      key: 'DATABASE_URL',
      description:
        cfg.backend === 'supabase'
          ? 'Conexión pooled (pooler transaction, puerto 6543) usada por la aplicación en runtime.'
          : 'Cadena de conexión a PostgreSQL usada por la aplicación y las migraciones.',
      secret: true,
      example: cfg.backend === 'supabase'
        ? 'postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true'
        : `postgresql://postgres:postgres@localhost:5432/${cfg.name}`,
      where: cfg.backend === 'supabase'
        ? 'Supabase Dashboard → Connect → Transaction pooler.'
        : 'Local: la del docker-compose.yml. Remota: la que entrega tu proveedor de PostgreSQL.',
    },
    ...(cfg.backend === 'supabase'
      ? [{
          key: 'DIRECT_URL',
          description: 'Conexión directa (puerto 5432) usada solo por las migraciones de Prisma.',
          secret: true,
          example: 'postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres',
          where: 'Supabase Dashboard → Connect → Direct connection.',
        }]
      : []),
  ],
  stack: ['Prisma 7 (ORM) sobre PostgreSQL con driver adapter `pg`'],
  notes: [
    'Prisma: esquema en `prisma/schema/*.prisma` (varios archivos). Cliente único `getPrisma()` en `src/lib/database/prisma.ts`; el cliente generado vive en `src/generated/prisma` (no se versiona).',
    'Prisma: el servicio `src/services/contact-service.ts` guarda mensajes en la tabla `contact_messages`; crea la primera migración con `db:migrate` antes de probar el formulario.',
  ],
};
