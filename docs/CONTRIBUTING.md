# Guía de contribución

## Propósito

Convenciones para cambiar Baretta Starter, tanto para personas como para agentes de IA.

## Flujo

1. Lee `docs/ARCHITECTURE.md` y `docs/TEMPLATES.md`.
2. Crea una rama por cambio.
3. Cambios pequeños y enfocados. Cada unidad incluye su código, sus tests y su documentación.
4. `npm test` debe pasar.
5. Si tocaste plantillas o módulos: valida con un proyecto real (`scripts/validate-project.mjs`).
6. Actualiza `docs/` si cambia el comportamiento.

## Commits

Conventional Commits: `feat(cli):`, `feat(templates):`, `fix(compat):`, `docs:`, `test:`, `chore:`.

## Reglas del repositorio

- Los módulos no editan `src/core`: se agregan con un módulo nuevo.
- Ninguna versión fuera de `compatibility/`. Nunca `latest`.
- Un estado `verified` solo se registra con `--record` tras una validación real.
- Comentarios y documentación en español; identificadores en inglés.
- Sin archivos vacíos ni integraciones ficticias. Si algo no se pudo probar, se documenta como `candidate`.
- No incluyas secretos, credenciales ni `node_modules` en el repositorio ni en el ZIP.
