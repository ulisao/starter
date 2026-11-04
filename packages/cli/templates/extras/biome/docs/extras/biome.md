# Biome (lint y formato)

## Propósito

Biome reemplaza a ESLint y Prettier con una sola herramienta rápida. Next.js 16 ya no incluye `next lint`, por eso el lint se ejecuta con Biome. No instales ESLint ni Prettier: duplicarían reglas y entrarían en conflicto.

## Arquitectura

- `biome.json` en la raíz es la única configuración. Usa las reglas recomendadas, formato con 2 espacios y ancho de línea de 120.
- Respeta tu `.gitignore` (`vcs.useIgnoreFile`) y excluye explícitamente `.next`, `src/generated`, `convex/_generated` y los reportes de pruebas.
- Solo procesa código y configuración (`ts`, `tsx`, `js`, `json`, `css`); Markdown y YAML quedan fuera. El asistente ordena los imports al ejecutar `check` o `lint:fix`.
- `css.parser.tailwindDirectives` permite que lea `@theme`, `@apply` y el resto de directivas de Tailwind 4.

## Comandos

- `<%= runCmd %> lint` ejecuta `biome check`: reglas de lint, formato e imports ordenados; falla si algo no está formateado (es lo que ejecuta la CI).
- `<%= runCmd %> lint:fix` aplica las correcciones seguras de `check` (formato e imports). El CLI lo ejecuta una vez tras instalar; si generaste con `--install skip`, ejecútalo tú antes del primer `lint`.
- `<%= runCmd %> format` solo formatea.

## Configuración

Para cambiar el estilo (ancho de línea, comillas, indentación) edita `formatter` o `javascript.formatter` en `biome.json`. Para desactivar una regla, agrégala en `linter.rules` (por ejemplo `"suspicious": { "noExplicitAny": "off" }`) y documenta el motivo en el commit. Si usas VS Code, instala la extensión oficial "Biome" y activa el formateo al guardar.

## Errores frecuentes

- **"Formatter would have printed..."** (en `check`): el archivo no está formateado; ejecuta `<%= runCmd %> lint:fix`.
- **Versión del esquema distinta**: si actualizas `@biomejs/biome`, ejecuta `<%= execCmd %> biome migrate --write` para actualizar `biome.json`.
- **Archivos generados reportados**: agrégalos a `files.includes` con el prefijo `!`.
