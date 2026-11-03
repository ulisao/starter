// Despliegue: todos los proyectos quedan preparados para Vercel y Docker (no se pregunta).

export default {
  id: 'deployment',
  when: () => true,
  templates: 'deployment',
  stack: ['Despliegue preparado para Vercel y Docker (multi-stage, usuario no root)'],
  notes: [
    'Deploy: Vercel y Docker no comparten configuración operativa. Toda variable `NEXT_PUBLIC_*` nueva debe declararse en el módulo correspondiente (el Dockerfile genera sus `ARG` desde esa lista). Ver `docs/DEPLOYMENT.md`.',
  ],
};
