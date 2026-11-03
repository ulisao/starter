# Publicación

## Propósito

Pasos para preparar y publicar `baretta` en npm. **Nada de esto se ejecutó**: el paquete no está publicado (ver README, estado del proyecto).

## Antes de publicar

1. **Nombre disponible**: `npm view baretta` devolvía 404 (libre) al 2026-11-03. Vuelve a comprobarlo; si alguien lo tomó, no cambies el nombre en silencio: documenta alternativas (`@estudiobaretta/baretta`, `baretta-starter`) y decide.
2. `npm test` pasa.
3. Matriz de validación real ejecutada y registrada (`npm run matrix -- --record`), y revisada en `docs/COMPATIBILITY.md`.
4. Versión: actualiza `packages/cli/package.json` y `STARTER_VERSION` en `src/core/generator/index.js` (deben coincidir).
5. `npm run pack:cli` y revisa el contenido del tarball (debe incluir `bin`, `src`, `templates`, `compatibility`, y no `tests`, `node_modules` ni secretos).

## Probar el paquete empaquetado

```bash
cd packages/cli && npm pack             # genera baretta-<version>.tgz
mkdir /tmp/prueba && cd /tmp/prueba
npm init -y && npm install /ruta/a/baretta-<version>.tgz
npx baretta --help
npx baretta create demo --backend postgres --auth none --yes --install skip
```

`npm run pack:cli` automatiza estos pasos.

## Publicar

```bash
cd packages/cli
npm login
npm publish --access public            # --provenance si se publica desde CI
```

Después: `npx baretta@latest create`. Crea un tag de git `v<versión>`.

## Después de publicar

- Prueba `npx baretta create` en una máquina limpia.
- Registra la versión publicada en el changelog del README.
