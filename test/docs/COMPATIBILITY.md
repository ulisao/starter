# Compatibilidad de versiones

## Propósito

Este proyecto fija una combinación de versiones que funciona en conjunto. **No actualices paquetes individualmente**: una versión más nueva de uno puede romper la integración con otro.

- Perfil: `stable` (2026.11.0)
- Node.js: `>=22.12.0`
- Estado de esta combinación: **verified**

Estados: `verified` (probada con build real), `candidate` (plausible, no validada del todo), `experimental` (con advertencias), `unsupported` (no se genera).

## Versiones fijadas

| Paquete | Versión | Estado |
| --- | --- | --- |
| `@clerk/nextjs` | `7.9.23` | verified |
| `@upstash/ratelimit` | `2.2.0` | verified |
| `@upstash/redis` | `1.41.0` | verified |
| `convex` | `1.49.0` | verified |
| `mercadopago` | `3.6.1` | verified |
| `next` | `16.4.4` | verified |
| `react` | `19.2.9` | verified |
| `react-dom` | `19.2.9` | verified |
| `resend` | `6.37.0` | verified |
| `server-only` | `0.0.1` | verified |
| `zod` | `4.6.7` | verified |
| `@playwright/test` | `1.64.1` | verified |
| `@tailwindcss/postcss` | `4.3.4` | verified |
| `@types/node` | `22.20.5` | verified |
| `@types/react` | `19.2.18` | verified |
| `@types/react-dom` | `19.2.7` | verified |
| `postcss` | `8.5.32` | verified |
| `tailwindcss` | `4.3.4` | verified |
| `typescript` | `5.9.3` | verified |
| `vitest` | `5.1.0` | verified |

## Cómo actualizar

1. Revisa la documentación oficial y los changelogs de cada paquete que quieras subir.
2. Comprueba los *peer dependencies* entre los paquetes del proyecto (por ejemplo, el adaptador de autenticación de Convex limita la versión de Better Auth).
3. Actualiza en un cambio aislado, ejecuta typecheck, tests y build, y registra la decisión en `docs/decisions/`.
