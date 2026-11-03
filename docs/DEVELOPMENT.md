# Desarrollo del CLI

## Requisitos

- Node.js >= 22.12
- npm >= 10 (otros gestores se prueban con `--pm`)
- Git

## Puesta en marcha

```bash
git clone <repo> baretta-starter && cd baretta-starter
cd packages/cli && npm install
npm link                      # expone el comando `baretta` en tu equipo
baretta --help
```

Sin `npm link`: `node packages/cli/bin/baretta.js create`.

## Probar el CLI

```bash
# Interactivo
baretta create

# No interactivo (CI, scripts, agentes)
baretta create demo --backend postgres --auth clerk --auth-method password-google \
  --payments none --extras biome,vitest --pm npm --install skip --yes --dir /tmp/demo
```

## Tests

```bash
npm test                      # desde la raíz: unit + integración
npm run test:unit
npm run test:integration
```

- **unit**: motor de plantillas, validación, compatibilidad, detección de package manager.
- **integration**: genera en memoria toda la matriz backend × auth × métodos × pagos × extras y verifica archivos, dependencias exactas, ausencia de lo no pedido, documentación y `baretta.config.json`.

Estos tests **no instalan dependencias**.

## Validación real de proyectos generados

```bash
node scripts/validate-project.mjs --name prueba --backend postgres --auth none --extras biome,vitest --keep
```

Genera en `C:/Users/PC/bs-work/<name>` (ruta corta para evitar el límite de longitud de Windows; cámbiala con `--workdir`), instala, ejecuta typecheck, lint, tests y build. Con `--record` actualiza el registro de compatibilidad si todo pasa.

Matriz completa (tarda: instala cada proyecto):

```bash
npm run matrix                # todas las combinaciones soportadas
npm run matrix -- --only convex-clerk
```

### Estrategia de CI para la matriz

No todo se ejecuta en cada push. Propuesta (ver `.github/workflows/ci.yml` del repositorio):

- En cada push/PR: tests unit + integración.
- En PR que toque `templates/`, `src/modules/` o `compatibility/`: `validate-matrix` con un subconjunto representativo (una combinación por backend + una con pagos + una con todos los extras).
- Semanal o antes de publicar: matriz completa con `--record` en una rama para actualizar el registro.

## Agregar funcionalidad

Ver `docs/TEMPLATES.md` (nuevo backend, proveedor de auth, método, extra, perfil).

## Trabajar con agentes de IA

El repositorio sigue las mismas reglas que los proyectos generados: lee `docs/ARCHITECTURE.md` y `docs/TEMPLATES.md` antes de cambiar el generador, no toques `src/core` para agregar una tecnología (usa módulos), y no marques nada como `verified` sin haber corrido `validate-project`.

## Errores frecuentes

- *"variable desconocida"* al generar: usaste `<%= x %>` con una variable que `plan()` no define.
- *"Conflicto de archivo"*: dos módulos escriben la misma ruta; declara `overrides` en el que corresponde.
- *"El perfil no define el paquete"*: falta la ficha en `compatibility/profiles/stable/packages/`.
- *Rutas largas en Windows*: usa `--workdir` con una ruta corta.
