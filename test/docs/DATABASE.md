# Base de datos y backend: Convex

## Propósito

Explica cómo está organizado el backend con Convex, cómo enlazarlo a un deployment y cómo agregar tablas y funciones sin romper la seguridad.

## Arquitectura

- Convex es la base de datos **y** el backend: no hay Prisma, SQL ni servidor propio. Tus funciones de TypeScript corren dentro de Convex.
- Esquema: `convex/schema.ts` (tablas con `defineTable` y validadores `v`).
- Funciones: un archivo por dominio en `convex/` (por ejemplo `convex/contactMessages.ts`). Cada `export` es una función invocable como `api.archivo.nombre`.
- `convex/_generated/`: tipos y referencias (`api`, `dataModel`, `server`) que **genera** `convex dev`. Se versiona; no lo edites a mano. Se incluye ya generado para que `typecheck` y `build` funcionen antes de enlazar un deployment.
- Cliente en el navegador: `src/lib/convex/client-provider.tsx` (montado en `src/components/providers.tsx`) habilita `useQuery` y `useMutation` con actualizaciones en tiempo real.
- Cliente en el servidor de Next.js: `fetchQuery` / `fetchMutation` / `fetchAction` de `convex/nextjs` (ejemplo en `src/services/contact-service.ts`).

## Tipos de función

| Tipo | Visible al cliente | Para qué |
| --- | --- | --- |
| `query` | Sí | Leer datos; es reactiva (se actualiza sola) y no tiene efectos secundarios |
| `mutation` | Sí | Escribir datos de forma transaccional |
| `action` | Sí | Llamar a servicios externos (email, pagos, IA); no accede a `ctx.db` directamente, usa `ctx.runQuery` / `ctx.runMutation` |
| `internalQuery` / `internalMutation` / `internalAction` | **No** | Lógica que solo llaman otras funciones, el Dashboard o `npx convex run` |

## Configuración inicial (primera vez)

1. Ejecuta `npx convex dev` (o `npm run convex:dev`). Inicia sesión con GitHub cuando lo pida y crea o elige un proyecto.
2. La CLI escribe `CONVEX_DEPLOYMENT` y `NEXT_PUBLIC_CONVEX_URL` en `.env.local`, sube tus funciones y deja el proceso observando cambios.
3. En otra terminal ejecuta `npm run dev` para levantar Next.js.

Sin cuenta puedes probar con un backend local: `npx convex dev` ofrece la opción local (anónima), que corre en tu máquina. Para producción necesitas un proyecto en la nube.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run convex:dev` | Sincroniza `convex/` con el deployment de desarrollo y regenera `_generated/` |
| `npm run convex:codegen` | Regenera `_generated/` sin desplegar |
| `npm run convex:deploy` | Despliega las funciones al deployment de producción |
| `npx convex run archivo:funcion '{"campo":"valor"}'` | Ejecuta una función (incluidas las `internal`) |
| `npx convex dashboard` | Abre el Dashboard (datos, logs, variables de entorno) |

## Variables de entorno

| Variable | Dónde | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` / hosting | URL pública del deployment; la usan el navegador y `convex/nextjs` |
| `CONVEX_DEPLOYMENT` | `.env.local` | Deployment que usa la CLI; no la lee la aplicación |

Las variables que leen **las funciones de Convex** (claves de terceros, secretos) NO van en `.env.local`: se guardan en el deployment con `npx convex env set NOMBRE valor` y se leen con `process.env.NOMBRE` dentro de `convex/`.

## Ejemplo: agregar una tabla y una función

```ts
// convex/schema.ts
tasks: defineTable({
  title: v.string(),
  done: v.boolean(),
  ownerId: v.string(),
}).index("by_owner", ["ownerId"]),
```

```ts
// convex/tasks.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Comprueba AQUÍ quién llama y qué puede ver (ver "Seguridad").
    return await ctx.db.query("tasks").collect();
  },
});

export const add = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", { title: args.title, done: false, ownerId: "..." });
  },
});
```

En un Client Component: `const tasks = useQuery(api.tasks.list)` y `const add = useMutation(api.tasks.add)`, con `import { api } from "../../convex/_generated/api"` (ajusta la ruta relativa).

## Seguridad (léelo antes de publicar)

- Toda `query`, `mutation` y `action` pública puede invocarse desde cualquier navegador con la URL del deployment, **sin pasar por tus Server Actions ni tu proxy**. Los permisos se comprueban **dentro de cada función**.
- Valida siempre los argumentos con `v`. Para reglas adicionales (largos, formatos) valida dentro del handler, como hace `contactMessages.create`.
- Lo que no debe llamar el cliente va en `internalQuery` / `internalMutation` / `internalAction`.
- Ninguna clave secreta debe tener el prefijo `NEXT_PUBLIC_`.
- Con Clerk, obtén la identidad con `ctx.auth.getUserIdentity()` (ver `convex/viewer.ts` y `docs/AUTHENTICATION.md`).

## Esquema y migraciones

Convex valida los documentos existentes contra el esquema al desplegar. Para evolucionar sin romper datos:

1. Agrega campos nuevos como `v.optional(...)`.
2. Despliega, rellena los datos (con una `internalMutation` ejecutada con `npx convex run`).
3. Si quieres, vuelve el campo obligatorio.

Para cambios grandes revisa el componente oficial de migraciones de Convex en su documentación.

## Despliegue

- Vercel: configura el comando de build como `npx convex deploy --cmd 'npm run build'` y las variables `CONVEX_DEPLOY_KEY` (Dashboard → Settings → Deploy Keys, entorno de producción) y `NEXT_PUBLIC_CONVEX_URL` queda definida automáticamente por ese comando.
- Docker: pasa `NEXT_PUBLIC_CONVEX_URL` como build arg (el Dockerfile ya la recibe); despliega las funciones aparte con `convex deploy`.

## Errores frecuentes

| Síntoma | Causa y solución |
| --- | --- |
| `Falta NEXT_PUBLIC_CONVEX_URL` al compilar | Ejecuta `npx convex dev` o define la variable en `.env.local` / en el hosting |
| `Could not find public function` | Las funciones no se subieron: deja `convex:dev` corriendo o ejecuta `convex:deploy` |
| Error de esquema al desplegar | Hay documentos que no cumplen el esquema nuevo: usa `v.optional` y migra |
| Los tipos de `api.*` no existen | Regenera con `npm run convex:codegen` |
