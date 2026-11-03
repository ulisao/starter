# Compatibilidad de versiones

## Propósito

Este proyecto fija una combinación de versiones que funciona en conjunto. **No actualices paquetes individualmente**: una versión más nueva de uno puede romper la integración con otro.

- Perfil: `<%= profileName %>` (<%= profileVersion %>)
- Node.js: `<%= nodeRange %>`
- Estado de esta combinación: **<%= compatStatus %>**

Estados: `verified` (probada con build real), `candidate` (plausible, no validada del todo), `experimental` (con advertencias), `unsupported` (no se genera).

## Versiones fijadas

<%= versionsTable %>

## Cómo actualizar

1. Revisa la documentación oficial y los changelogs de cada paquete que quieras subir.
2. Comprueba los *peer dependencies* entre los paquetes del proyecto (por ejemplo, el adaptador de autenticación de Convex limita la versión de Better Auth).
3. Actualiza en un cambio aislado, ejecuta typecheck, tests y build, y registra la decisión en `docs/decisions/`.
