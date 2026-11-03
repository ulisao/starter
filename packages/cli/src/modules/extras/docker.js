// Extra: herramientas Docker para desarrollo local. El Dockerfile y docker-compose.yml de
// producción los genera el módulo `deployment`; este extra solo añade el compose de desarrollo.

export default {
  id: 'extra-docker',
  when: (cfg) => cfg.extras.includes('docker'),
  templates: 'extras/docker',
  scripts: (cfg) => ({
    'docker:dev': cfg.backend === 'postgres' ? 'docker compose -f docker-compose.dev.yml up -d --wait' : 'docker compose -f docker-compose.dev.yml up',
    'docker:down': 'docker compose -f docker-compose.dev.yml down',
  }),
  summary: 'Docker (desarrollo): `docker-compose.dev.yml` y scripts `docker:dev`/`docker:down`. Doc: `docs/extras/docker.md`.',
  stack: ['Docker Compose para desarrollo local (`docker-compose.dev.yml`)'],
  notes: ['Docker (desarrollo): `docker:dev` levanta el entorno local y `docker:down` lo detiene; la imagen de producción es independiente. Ver `docs/extras/docker.md`.'],
};
