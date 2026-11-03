# Guía de contribución

## Propósito

Convenciones para cambiar este proyecto, tanto para personas como para agentes de IA.

## Flujo

1. Lee `AGENTS.md` y la documentación relacionada con la tarea.
2. Crea una rama por cambio.
3. Haz cambios pequeños y enfocados; mantén la arquitectura de `docs/ARCHITECTURE.md`.
4. Ejecuta la validación de la sección 16 de `AGENTS.md`.
5. Actualiza la documentación afectada.

## Commits

Usa Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Estilo

- Comentarios en español que expliquen el motivo de las decisiones.
- TypeScript estricto, sin `any`.
- Estilos con los tokens de `src/styles/globals.css`.

## Decisiones

Las decisiones de arquitectura se registran en `docs/decisions/NNNN-titulo.md`.
