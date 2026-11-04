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

# Diagnosticar un proyecto generado contra el registro (no instala ni toca la red)
baretta doctor ./demo

# Reconciliar sus versiones con el perfil (sin tocar tu código); previsualizar con --dry-run
baretta update ./demo --dry-run
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

Matriz (cada proyecto se instala y compila, así que tarda):

```bash
npm run matrix                      # subconjunto representativo (instala + build real)
npm run matrix -- --full            # toda la matriz
npm run matrix -- --dry             # solo generación (sin instalar), humo rápido
npm run matrix -- --only convex     # filtra por nombre de combinación
npm run matrix -- --record          # marca verified lo que pase
```

### Estrategia de CI para la matriz

No todo se ejecuta en cada push. El workflow del repositorio (`.github/workflows/ci.yml`) ya corre, en cada push/PR a `main`, los tests unit + integración y la matriz **en modo seco** (`--full --dry`: verifica que toda combinación genera sin marcadores sin resolver, sin instalar nada).

Lo que conviene hacer aparte, a mano o en un job programado (es lento: instala cada proyecto):

- En PR que toque `templates/`, `src/modules/` o `compatibility/`: `npm run matrix` (subconjunto representativo con build real).
- Semanal o antes de publicar: `npm run matrix -- --full --record` en una rama para actualizar el registro.

## Agregar funcionalidad

Ver `docs/TEMPLATES.md` (nuevo backend, proveedor de auth, método, extra, perfil).

## Trabajar con agentes de IA

El repositorio sigue las mismas reglas que los proyectos generados: lee `docs/ARCHITECTURE.md` y `docs/TEMPLATES.md` antes de cambiar el generador, no toques `src/core` para agregar una tecnología (usa módulos), y no marques nada como `verified` sin haber corrido `validate-project`.

## Errores frecuentes

- *"variable desconocida"* al generar: usaste `<%= x %>` con una variable que `plan()` no define.
- *"Conflicto de archivo"*: dos módulos escriben la misma ruta; declara `overrides` en el que corresponde.
- *"El perfil no define el paquete"*: falta la ficha en `compatibility/profiles/stable/packages/`.
- *Rutas largas en Windows*: usa `--workdir` con una ruta corta.
