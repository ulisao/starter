# Autenticación (Clerk)

## Propósito
Este proyecto usa [Clerk](https://clerk.com) para registrar usuarios e iniciar sesión.
Método de acceso elegido: **Solo Google**.

Autenticación responde "quién es este usuario"; autorización, "qué puede hacer". Clerk resuelve
lo primero. Lo segundo lo decides tú y **siempre se verifica en el servidor** (ver el ejemplo de
`publicMetadata.role` en `src/app/(dashboard)/dashboard/page.tsx`).

## Arquitectura
| Archivo | Función |
| --- | --- |
| `src/components/providers.tsx` | Monta `<ClerkProvider>` (generado desde el módulo). |
| `src/proxy.ts` | `clerkMiddleware`: lee la sesión y protege `/dashboard`. Next.js 16 usa `proxy.ts`, no `middleware.ts`. |
| `src/app/sign-in`, `src/app/sign-up` | Páginas con los componentes oficiales `<SignIn />` y `<SignUp />`. |
| `src/components/layout/site-header.tsx` | Botones de acceso y `<UserButton />`. |
| `src/lib/auth/session.ts` | `getSessionUserId()`: id del usuario o `null` (contrato común, solo servidor). |
| `src/app/(dashboard)/dashboard/page.tsx` | Ejemplo de página protegida y autorización en el servidor. |

## Configuración
1. Crea una cuenta en <https://dashboard.clerk.com> y pulsa **Create application**.
2. Ve a **API keys** y copia la publishable key y la secret key.
3. Copia `.env.example` a `.env.local` y completa `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.
4. Activa el método de acceso en el Dashboard (ver abajo).
5. Ejecuta `npm run dev` y abre `/sign-in`.

### Activar el método elegido en el Dashboard de Clerk
Se configura en **Configure → User & authentication** (sección *Email, phone, username*) y **SSO connections**. El código del proyecto es el mismo para todos los métodos; lo que cambia es esta configuración.

**Google:** en **SSO connections** añade *Google*. En desarrollo Clerk usa credenciales compartidas; en producción debes crear tus propias credenciales OAuth en Google Cloud Console y pegarlas allí.

Importante: Clerk NO impone el método desde el código. Si el Dashboard tiene otros métodos activos, también aparecerán en `<SignIn />`. Revisa que el Dashboard coincida con el método elegido.

## Variables de entorno
Ver la tabla en `docs/ENVIRONMENT.md`. `CLERK_SECRET_KEY` es secreta: nunca la expongas en el navegador ni uses el prefijo `NEXT_PUBLIC_`.

## Ejemplos
```ts
import { getSessionUserId } from "@/lib/auth/session";

const userId = await getSessionUserId(); // string | null
if (!userId) throw new Error("No autenticado");
```
Para proteger más rutas, agrégalas a `createRouteMatcher([...])` en `src/proxy.ts` y vuelve a comprobar la sesión dentro de cada Server Action o Route Handler.

## Errores frecuentes
- **`Publishable key not valid` en el build:** la clave debe empezar por `pk_test_` o `pk_live_` y copiarse completa.
- **Redirección infinita a `/sign-in`:** las URLs de `.env.local` no coinciden con las rutas reales.
- **Aparecen métodos de acceso que no elegiste:** están activos en el Dashboard de Clerk; desactívalos allí.
- **`auth() was called but Clerk can't detect usage of clerkMiddleware()`:** el archivo debe llamarse `src/proxy.ts` y exportar el middleware por defecto.
- **Producción:** crea una instancia de producción en Clerk y usa sus claves (`pk_live_` y `sk_live_`); las claves de desarrollo no sirven.

## Integración con Convex
Convex valida los tokens que emite Clerk; así las funciones de `convex/` saben quién llama sin que el cliente pueda falsificarlo.

1. En el Dashboard de Clerk abre **Integrations → Convex** y actívala (crea la configuración JWT para Convex). Copia el **Frontend API URL** (Configure → Developers → API keys).
2. Guarda ese dominio en el deployment de Convex (no en `.env.local`): `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://tu-instancia.clerk.accounts.dev`. Para producción repite el comando contra el deployment de producción (`--prod`).
3. Ejecuta `npm run convex:dev` para subir `convex/auth.config.ts`.

Piezas: `convex/auth.config.ts` (declara a Clerk como emisor), `src/lib/convex/client-provider.tsx` (`ConvexProviderWithClerk`, anidado dentro de `<ClerkProvider>`) y `convex/viewer.ts` (ejemplo de función que lee la identidad con `ctx.auth.getUserIdentity()`; `identity.subject` es el mismo id que devuelve `getSessionUserId()`).

Errores frecuentes: `No auth provider found matching the given token` indica que `CLERK_JWT_ISSUER_DOMAIN` falta o no coincide con el emisor del token; `useQuery` devuelve datos de usuario `null` mientras Clerk carga (usa `useConvexAuth()` para esperar).
