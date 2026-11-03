// Backend: PostgreSQL propio (administrado por el usuario). El ORM lo aporta orm-prisma.

export default {
  id: 'backend-postgres',
  when: (cfg) => cfg.backend === 'postgres',
  templates: 'backend/postgres',
  stack: ['PostgreSQL propio (local con Docker Compose o remoto)'],
  notes: ['Backend PostgreSQL propio: ver `docs/DATABASE.md` para conectar una base local o remota.'],
};
