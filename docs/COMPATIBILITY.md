# Sistema de compatibilidad

## Propósito

Garantiza que cada proyecto generado use una **combinación de versiones que funciona en conjunto**, en lugar de la última versión de cada paquete. Es el componente más importante del producto: toda versión sale de aquí.

## Estructura

```text
packages/cli/compatibility/
├── profiles/
│   └── stable/
│       ├── profile.json        nombre, versión del perfil, rango de Node, reglas
│       └── packages/*.json     una ficha por paquete npm
└── combinations/
    └── next-<backend>-<auth>.json   estado de cada combinación
```

### Ficha de paquete

```json
{
  "name": "prisma",
  "version": "7.10.1",
  "status": "verified",
  "verifiedAt": "2026-11-03",
  "sources": ["https://www.npmjs.com/package/prisma"],
  "notes": "NO usar dist-tag latest (8.0.0-rc.30). Engines: ^20.19||^22.12||>=24."
}
```

### Combinación

```json
{
  "id": "next-convex-better-auth",
  "backend": "convex",
  "auth": "better-auth",
  "status": "candidate",
  "overrides": { "better-auth": "1.6.34" },
  "notes": "@convex-dev/better-auth exige better-auth <1.7.0."
}
```

`overrides` fija una versión distinta del perfil **solo para esa combinación**.

## Estados

| Estado | Significado | ¿Se genera? |
| --- | --- | --- |
| `verified` | Probada con instalación, typecheck y build reales | Sí |
| `candidate` | Plausible, todavía no validada del todo | Sí, con advertencia |
| `experimental` | Requiere advertencias (ej: Convex Auth, versión 0.0.x) | Sí, con advertencia |
| `unsupported` | No funciona | No: el generador falla |

El estado de un proyecto es el **peor** entre su combinación y todos los paquetes que incluye. Nunca se presenta `candidate` o `experimental` como `verified`.

## Decisiones del perfil `stable` (2026-11-03)

- **Prisma 7.10.1**, no `latest`: el dist-tag `latest` apunta a `8.0.0-rc.30`, que es un release candidate.
- **TypeScript 5.9.3**, no `latest`: `latest` es la 7.x (port nativo), demasiado nueva para un perfil conservador.
- **Node >=22.12**: Convex exige >=22 y Vitest 5 exige ^22.12.
- **Better Auth 1.7.15**, salvo con Convex: `@convex-dev/better-auth` declara el peer `better-auth >=1.6.11 <1.7.0`, así que esa combinación usa 1.6.34.

## Cómo se verifica una combinación

```bash
node scripts/validate-project.mjs --name prueba --backend postgres --auth clerk --auth-method password-google \
  --env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... --record
```

El script genera el proyecto, instala, ejecuta typecheck, lint y tests si existen, y build de producción. Con `--record`, **solo si todo pasó**, marca la combinación y los paquetes como `verified` con la fecha. Los logs quedan en `<workdir>/<name>.log`.

La matriz completa se ejecuta con `npm run matrix` (ver `docs/DEVELOPMENT.md`).

## Cómo actualizar versiones

1. Revisa documentación oficial, changelogs y breaking changes de cada paquete a subir.
2. Consulta `engines` y `peerDependencies` (`npm view <pkg>@<version> engines peerDependencies --json`).
3. Edita las fichas en `profiles/stable/packages/` (o crea un perfil nuevo copiando `stable`). Pon el estado en `candidate` y `verifiedAt` en `null`.
4. Si una combinación necesita otra versión, usa `overrides`.
5. Ejecuta `npm run matrix`; con `--record` se vuelven a marcar `verified` las que pasen.
6. Registra la decisión en `docs/DECISIONS.md`.

No hace falta tocar el código del CLI para nada de esto.

## Futuro

La arquitectura permite agregar `baretta doctor`, `baretta update` y `baretta compatibility` (este último ya existe en versión de solo lectura) leyendo `baretta.config.json` del proyecto y comparándolo con el registro.
