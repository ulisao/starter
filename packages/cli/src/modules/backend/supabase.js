// Backend: Supabase como PostgreSQL gestionado. El ORM (Prisma) lo aporta orm-prisma,
// que ya define DATABASE_URL (pooler) y DIRECT_URL (migraciones) para este backend.
//
// Este módulo NO instala @supabase/supabase-js: sin Supabase Auth ni Storage el proyecto
// habla con la base solo a través de Prisma, así que el cliente sería código muerto.
// "Supabase como backend" y "Supabase Auth" son decisiones separadas (ver docs/DATABASE.md).

export default {
  id: 'backend-supabase',
  when: (cfg) => cfg.backend === 'supabase',
  templates: 'backend/supabase',
  stack: ['Supabase como PostgreSQL gestionado (conexión pooled para runtime, directa para migraciones)'],
  notes: [
    'Backend Supabase: la base se usa solo mediante Prisma (`getPrisma()`); no hay cliente de Supabase en el código salvo que elijas Supabase Auth. Lee `docs/DATABASE.md` (pooled vs directa, migraciones, RLS).',
  ],
};
