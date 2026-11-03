# Brief común para escritores de módulos — Baretta Starter

Repositorio: `C:\Users\PC\Desktop\Repositorios\starter` (Windows, Git Bash disponible, Node 24, npm 11). El CLI está en `packages/cli`. Ya funciona de punta a punta para `postgres + sin auth` (instala, `tsc` y `next build` pasan). Tu trabajo es agregar UNA capa nueva siguiendo el mismo contrato, sin tocar el núcleo.

## Qué es el producto
`baretta create` genera un proyecto Next.js 16 (App Router, React 19, TS estricto, Tailwind 4) componiendo **módulos**. Cada módulo es un archivo JS en `packages/cli/src/modules/<capa>/*.js` + una carpeta de plantillas en `packages/cli/templates/<capa>/<nombre>/`. El generador (`packages/cli/src/core/generator/index.js`) activa los módulos cuyo `when(cfg)` da true, copia sus plantillas (renderizadas), arma `package.json` (versiones SOLO desde el perfil de compatibilidad), `.env.example`, `AGENTS.md`, docs. **Lee primero**: `core/generator/index.js`, `core/filesystem/template.js`, `core/configuration/schema.js`, `modules/backend/prisma.js` y `modules/base/base.js` (ejemplos reales), y la carpeta `templates/base/` para ver el estilo.

## Contrato de un módulo (`export default {…}` u array de módulos)
```js
{
  id: 'auth-clerk',                 // único
  when: (cfg) => cfg.auth === 'clerk',
  templates: 'auth/clerk',          // carpeta bajo packages/cli/templates/ (opcional)
  overrides: ['src/x.ts'],          // rutas de OTRO módulo que este puede reemplazar. Si dos módulos escriben la misma ruta sin declararlo → error de conflicto.
  dependencies: ['pkg'] | fn(cfg),  // nombres npm; la versión sale del perfil (compatibility/profiles/stable/packages/*.json) con overrides por combinación
  devDependencies: [...],
  scripts: { name: 'cmd' } | fn(cfg),
  env: [{ key, description, secret: bool, example, where }] | fn(cfg),   // secret=true NO puede empezar con NEXT_PUBLIC_
  providers: [{ importLine, open, close, order }],  // proveedores React que se anidan en src/components/providers.tsx (order menor = más externo)
  slots: { nombre: 'texto' | fn(cfg) },             // contribuye texto a un slot; las plantillas lo imprimen con <%= slot_nombre %>. Slots ya existentes: nextConfigImports, nextConfigWrappers (en templates/base/next.config.ts: aquí se envuelve `config`, ej. `config = withSentryConfig(config, {...});`)
  stack: ['línea para AGENTS.md/README'], notes: ['nota para AGENTS.md sección 17'],
  summary: 'una línea (solo extras; aparece en docs/EXTRAS.md)',
  packageJson: (pkg, cfg) => {...}  // hook para campos extra (poco frecuente)
}
```
La capa se deduce de la carpeta (`backend`, `auth`, `payments`, `extras`, `deployment`). Orden de composición: base → backend → auth → payments → extras → deployment.

## Plantillas
- Sintaxis propia (NO `{{ }}`, choca con JSX): `<%= variable %>` y directivas **en línea propia**: `<%#if flag%>`, `<%#if !flag%>`, `<%#else%>`, `<%#endif%>` (anidables). Variable o flag desconocidos → el generador falla. Nunca pongas una directiva en medio de una línea.
- Flags: `hasConvex hasSupabase hasPostgres hasPrisma hasAuth isClerk isSupabaseAuth isBetterAuth isConvexAuth authPassword authGoogle authMagicLink authOtp hasPayments payOneTime paySubscription pmNpm pmPnpm pmYarn pmBun` y `has<Extra>` = `hasResend hasSentry hasDocker hasBiome hasVitest hasPlaywright hasGithubActions hasStorage hasAi hasRateLimit hasAnalytics`.
- Variables: `name backend backendLabel auth authLabel authMethod authMethodLabel paymentType packageManager installCmd ciInstallCmd runCmd execCmd lockfile nodeRange nodeMajor profileName profileVersion starterVersion compatStatus stackList moduleNotes extrasSummary versionsTable envTable scriptsList dockerBuildArgs composeBuildArgs` + `slot_*`.
- Un segmento de ruta que empieza con `dot-` se escribe con punto (`dot-github` → `.github`, `dot-gitignore` → `.gitignore`). Úsalo SIEMPRE para dotfiles (npm no publica `.gitignore` ni evita problemas con carpetas ocultas).
- Un archivo de plantilla = su ruta relativa dentro de la carpeta del módulo es la ruta en el proyecto generado (`templates/auth/clerk/src/proxy.ts` → `src/proxy.ts`). Next 16: `middleware.ts` se renombró **`proxy.ts`** (export `proxy` o default) — verifícalo en la doc.
- Archivos de texto únicamente (nada binario).

## Convenciones del código generado (OBLIGATORIAS)
- **Comentarios y docs en español neutro** (sin voseo en artefactos generados: "Revisa", "Configura", no "Revisá"). Comentarios extensos y útiles: qué hace, por qué existe, qué se puede modificar, qué valores reemplazar, de dónde obtenerlos, consecuencias de cambiarlo. Sin comentarios obvios. Identificadores en inglés.
- Server Components por defecto; `"use client"` solo si hace falta. Código de servidor importa `server-only` y lee secretos con `requireEnv` de `@/lib/env` (lazy: nunca al importar el módulo, para que `next build` no exija credenciales).
- Valida TODA entrada externa con Zod (4.x: `z.email()`, `z.flattenError(err)`), autoriza en el servidor, nunca confíes en el cliente. Secretos jamás con `NEXT_PUBLIC_`.
- Estructura: rutas delgadas en `src/app`, lógica en `src/services`, integraciones en `src/lib/<nombre>/`, dominio en `src/features/<dominio>/` (con `index.ts` público). Páginas públicas en `src/app/(public)/`, protegidas en `src/app/(dashboard)/`. Sin carpetas vacías ni archivos de relleno.
- Cada módulo con complejidad aporta su doc en `docs/` (nombres canónicos: `AUTHENTICATION.md`, `DATABASE.md`, `PAYMENTS.md`, `EXTRAS.md` es generado — NO lo crees; para extras documenta en `docs/extras/<id>.md`). Cada doc: Propósito, arquitectura, configuración (pasos para obtener credenciales), comandos, variables de entorno, ejemplos, errores frecuentes. Para módulos de dominio complejo (pagos, permisos) agrega `AGENTS.md` local dentro de su feature.
- Contrato entre módulos: **todo módulo de autenticación debe exportar `getSessionUserId(): Promise<string | null>` desde `src/lib/auth/session.ts`** (server-only; devuelve el id del usuario autenticado o null). El módulo de pagos lo usa si `hasAuth`. El extra Resend debe exportar `sendEmail({ to, subject, text, html? }): Promise<void>` desde `src/lib/email/send.ts` (server-only).
- No dupliques helpers existentes: reutiliza `requireEnv`, `AppError`/`errorResponse`, `Button`, `siteConfig`.

## Versiones y compatibilidad (regla de oro)
- NUNCA `latest`. Las versiones viven en `packages/cli/compatibility/profiles/stable/packages/<nombre>.json` (`/` y `@` del nombre npm se reemplazan: `@clerk/nextjs` → `clerk-nextjs.json`). Si tu módulo necesita un paquete que no está, crea su ficha (campos: name, version, status:"candidate", verifiedAt:null, sources[], notes) con una versión que hayas comprobado con `npm view <pkg> version`/`peerDependencies`/`engines` y que sea compatible con **Node >=22.12, Next 16.4.4, React 19.2.9, TS 5.9.3, Zod 4.6.7, Prisma 7.10.1**. Si una versión estable difiere del `latest` por incompatibilidad, usa la compatible y explícalo en `notes`.
- Estado por combinación backend+auth en `compatibility/combinations/next-<backend>-<auth>.json` (ya existen; `overrides` fija versiones por combinación). No inventes compatibilidades: **verifica contra la documentación oficial actual** (usa las herramientas `mcp__context7__resolve-library-id` y `mcp__context7__query-docs`, y WebFetch/WebSearch si hace falta). Muchas librerías cambiaron de API recientemente (Prisma 7, Next 16 `proxy.ts`, Better Auth 1.7, Clerk 7, Supabase publishable keys…): no confíes en tu memoria; la validación con `tsc` + `next build` real es el juez.

## Validación REAL (obligatoria antes de reportar)
```bash
cd C:/Users/PC/Desktop/Repositorios/starter
node scripts/validate-project.mjs --name <prefijo-unico> --backend postgres --auth none [--auth-method password] [--payments one-time] [--extras biome,vitest] [--env CLAVE=valor ...] --keep
```
Genera en `C:/Users/PC/bs-work/<name>`, instala, `typecheck`, `lint`/`test` si existen y `build`. Logs en `C:/Users/PC/bs-work/<name>.log`. Usa un `--name` único con tu prefijo de unidad (otros escritores corren en paralelo; no toques proyectos ajenos). `--env` pasa valores falsos con formato válido solo para el build. Si pasa TODO, repite con `--record` (marca paquetes y combinación como `verified` en el registro). **No marques `--record` si algo falló o si omitiste un paso**; un paso que no pudiste validar (credenciales externas, otra capa pendiente) se reporta como no validado y el módulo queda `candidate`. Valida también la ausencia: generar con tu módulo desactivado no debe agregar archivos ni dependencias tuyas (`node -e` con `plan()` basta).
Comprueba además que las plantillas rendericen limpio (sin `<%` residual) y que `.env.example` y `AGENTS.md` generados mencionen tu módulo.

## Límites (muy importante)
- Edita SOLO tus "Allowed edit surfaces". NO toques `packages/cli/src/core/**`, `src/cli/**`, `templates/base/**`, `templates/deployment/**`, `scripts/**`, módulos/plantillas de otras unidades. Si necesitas un cambio en esas áreas (una variable de contexto nueva, un slot, una corrección del núcleo), NO lo hagas: descríbelo con precisión en tu reporte (qué archivo, qué cambio, por qué) y trabaja alrededor mientras tanto.
- **No hagas commits ni push**: el orquestador es dueño de git. No borres scratch ajeno; sí limpia tus carpetas en `C:/Users/PC/bs-work` al terminar (salvo logs).
- No agregues dependencias innecesarias. No generes integraciones ficticias ni archivos vacíos. No afirmes que verificaste algo que no ejecutaste: reporta `<comando>: <resultado observado>`.
- Decisiones menores las tomas tú (simple, seguro, mantenible); solo reporta como bloqueo algo que cambie el alcance o sea incompatible.

## Reporte final (breve, ≤ 40 líneas)
1) Archivos creados/modificados. 2) Comandos de validación y resultado real de cada uno. 3) Qué quedó `verified` vs `candidate` y por qué. 4) Pedidos de cambio al núcleo (si hay). 5) Limitaciones/pendientes reales. Cierra con un bloque `## Key Learnings` de 1–5 ítems numerados (cada uno una oración factual de ≥20 caracteres y ≥4 palabras) si hubo aprendizajes reutilizables.
