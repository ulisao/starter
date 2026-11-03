# Plantillas y módulos

## Propósito

Cómo agregar o modificar lo que el generador produce. Todo se hace con **módulos** (`src/modules`) y **plantillas** (`templates`).

## Sintaxis de plantillas

Se usa una sintaxis propia porque `{{ }}` choca con JSX (`style={{ }}`) y con GitHub Actions (`${{ }}`).

```text
<%= variable %>          interpola (falla si no existe)
<%#if flag%>             condicional (en una línea propia)
<%#if !flag%>            negado
<%#else%>
<%#endif%>               las directivas se pueden anidar
```

- Las directivas **siempre ocupan una línea completa** (la línea se elimina del resultado).
- Un segmento de ruta `dot-xxx` se escribe como `.xxx` (`dot-github` → `.github`).
- La ruta relativa dentro de la carpeta del módulo es la ruta en el proyecto generado.
- Solo archivos de texto.

### Variables y flags disponibles

Flags: `hasConvex hasSupabase hasPostgres hasPrisma hasAuth isClerk isSupabaseAuth isBetterAuth isConvexAuth authPassword authGoogle authMagicLink authOtp hasPayments payOneTime paySubscription pmNpm pmPnpm pmYarn pmBun` y uno por extra (`hasResend`, `hasSentry`, `hasBiome`, ...).

Variables: `name backend backendLabel auth authLabel authMethodLabel packageManager installCmd ciInstallCmd runCmd execCmd lockfile nodeRange profileName profileVersion compatStatus stackList moduleNotes extrasSummary versionsTable envTable scriptsList dockerBuildArgs composeBuildArgs`.

La lista completa está en `buildFlags()` y `plan()` de `src/core/generator/index.js`.

## Contrato de un módulo

```js
export default {
  id: 'auth-clerk',                       // único
  when: (cfg) => cfg.auth === 'clerk',    // cuándo aplica
  templates: 'auth/clerk',                // carpeta bajo templates/
  overrides: ['src/components/layout/site-header.tsx'], // archivos de otro módulo que reemplaza
  dependencies: ['@clerk/nextjs'],        // nombres npm; la versión sale del perfil
  devDependencies: [],
  scripts: {},
  env: [{ key, description, secret, example, where }],
  providers: [{ importLine, open, close, order }],
  slots: { nextConfigWrappers: 'config = withX(config);' },
  stack: ['Clerk (autenticación)'],       // aparece en AGENTS.md y README
  notes: ['Clerk: ...'],                  // AGENTS.md sección 17
  summary: '...',                         // solo extras: docs/EXTRAS.md
};
```

Los módulos se descubren solos: todo `src/modules/<capa>/*.js` se carga. No hay registro que editar.

## Reglas

1. **Ninguna versión en plantillas ni código**: se declara el nombre y el perfil resuelve la versión.
2. **Nunca un secreto con `NEXT_PUBLIC_`**: el generador falla si ocurre.
3. **Conflictos explícitos**: dos módulos que escriben la misma ruta requieren `overrides`.
4. **Comentarios y docs en español**, útiles (qué hace, por qué, qué se puede cambiar, de dónde sale cada valor).
5. **Sin archivos vacíos** ni carpetas sin propósito.
6. Verifica siempre con un proyecto real (`scripts/validate-project.mjs`).

## Ejemplo: agregar un extra

Supongamos un extra `feature-flags`.

1. Declara la opción en `src/core/configuration/schema.js` (`EXTRAS` y `LABELS.extras`).
2. Crea `src/modules/extras/feature-flags.js`:

```js
export default {
  id: 'extra-feature-flags',
  when: (cfg) => cfg.extras.includes('feature-flags'),
  templates: 'extras/feature-flags',
  dependencies: [],
  env: [{ key: 'FLAGS_PROVIDER_URL', description: 'URL del servicio de flags', secret: false, example: 'http://localhost:9000' }],
  summary: 'Flags de funcionalidad con interfaz desacoplada.',
  notes: ['Feature flags: ver `docs/extras/feature-flags.md`.'],
};
```

3. Crea `templates/extras/feature-flags/src/lib/flags/index.ts` y `templates/extras/feature-flags/docs/extras/feature-flags.md`.
4. Si usa un paquete npm, agrega su ficha en `compatibility/profiles/stable/packages/`.
5. Valida: `node scripts/validate-project.mjs --name flags --backend postgres --extras feature-flags --record`.
6. Agrega la entrada a la matriz de tests si corresponde.

## Ejemplo: agregar un backend

1. Agrega el valor a `BACKENDS`, `LABELS.backend` y, si usa Prisma, a `PRISMA_BACKENDS` en `schema.js`.
2. Crea `src/modules/backend/<nombre>.js` con su `templates/backend/<nombre>/` (incluye `docs/DATABASE.md`).
3. Declara qué proveedores de auth admite en `AUTH_BACKENDS` (`schema.js`) y `AUTH_FOR_BACKEND` (`wizard.js`).
4. Crea una combinación `compatibility/combinations/next-<backend>-<auth>.json` por cada auth admitida.
5. Agrega las combinaciones a `COMBOS` en `tests/integration/generate.test.js`.

## Ejemplo: agregar un proveedor de autenticación

1. Agrega el valor a `AUTHS`, `LABELS.auth`, `AUTH_BACKENDS` y `AUTH_METHOD_SUPPORT` (`schema.js`), y su flag `isXxx` en `buildFlags`.
2. Crea `src/modules/auth/<nombre>.js` y `templates/auth/<nombre>/` con: provider (`providers`), `src/proxy.ts`, páginas de login, `(dashboard)`, **`src/lib/auth/session.ts` con `getSessionUserId()`**, `docs/AUTHENTICATION.md`.
3. Usa `overrides` para reemplazar `src/components/layout/site-header.tsx`.
4. Crea las fichas de paquetes y las combinaciones; valida con los cinco métodos.

## Ejemplo: agregar un método de autenticación

1. Agrega el valor a `AUTH_METHODS` y `LABELS.authMethod`; decláralo en `AUTH_METHOD_SUPPORT` para los proveedores que lo soporten de verdad (los demás lo rechazarán con un motivo).
2. Agrega un flag (`authXxx`) en `buildFlags` y úsalo con `<%#if authXxx%>` en las plantillas de cada proveedor.
3. Valida cada proveedor con el método nuevo.

## Ejemplo: agregar un perfil de compatibilidad

Copia `compatibility/profiles/stable` a `compatibility/profiles/<nombre>`, edita `profile.json` y las fichas, y regenera con `plan(cfg, { profileName: '<nombre>' })`. Ver `docs/COMPATIBILITY.md`.
