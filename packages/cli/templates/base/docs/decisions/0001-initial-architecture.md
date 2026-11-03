# 0001 — Arquitectura inicial

- Estado: aceptada
- Generado por: Baretta Starter <%= starterVersion %> (perfil `<%= profileName %>`)

## Contexto

Proyecto Next.js pensado para evolucionar con agentes de IA. Necesita una estructura explícita y predecible.

## Decisión

- Next.js App Router con TypeScript estricto y Tailwind CSS.
<%#if hasPrisma%>
- Backend: <%= backendLabel %> con Prisma como ORM.
<%#else%>
- Backend: <%= backendLabel %> (modelo de datos nativo, sin ORM).
<%#endif%>
- Autenticación: <%= authLabel %>.
- Organización por features (`src/features`), servicios reutilizables (`src/services`) e integraciones (`src/lib`).
- Versiones fijadas por un perfil de compatibilidad, no por `latest`.
- Despliegue preparado para Vercel y Docker.

## Consecuencias

- Las rutas son delgadas y la lógica es testeable fuera de Next.js.
- Actualizar dependencias es una decisión explícita y documentada.
- `baretta.config.json` describe el estado original del proyecto para herramientas futuras.
