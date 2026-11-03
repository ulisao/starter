# Autenticación: Convex Auth (experimental)

## Propósito

Explica cómo funciona el acceso de usuarios con Convex Auth (`@convex-dev/auth`), cómo configurarlo y cómo proteger rutas y datos. Método elegido en este proyecto: **<%= authMethodLabel %>**.

## Estado: experimental (léelo primero)

- `@convex-dev/auth` está en versión **0.0.x** (pre-1.0): la API puede cambiar entre versiones. Las versiones están fijadas en `package.json`; no actualices sin probar el flujo completo.
- Su soporte para Next.js es **limitado y poco probado frente a otras opciones**. Lo que debes conocer:
  - La integración depende de un proxy propio (`src/proxy.ts`) que atiende `/api/auth` y renueva tokens en cookies. La documentación de la librería lo llama `middleware`; en Next.js 16 el archivo se llama `proxy.ts`. Vuelve a probar el flujo completo cada vez que actualices Next.js o la librería.
  - `ConvexAuthNextjsServerProvider` guarda el estado de sesión en cookies. Para evitar ataques CSRF **no hagas efectos secundarios desde el servidor de Next.js en peticiones GET**: desde Server Components y `GET` Route Handlers solo llama a *queries* de Convex; las *mutations* y *actions* van en Server Actions (POST) o desde el cliente.
  - El provider lee cookies en el layout raíz, así que las páginas se renderizan de forma dinámica (sin pre-renderizado estático).
  - No incluye roles, organizaciones, MFA ni panel de administración, ni recuperación de contraseña lista para usar. Si los necesitas, evalúa Clerk o Better Auth.
- Estado de compatibilidad de esta combinación: `experimental` (ver `docs/COMPATIBILITY.md`).

## Arquitectura

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Configuración de proveedores | `convex/auth.ts` | Define los métodos de acceso y exporta las funciones que usa el cliente (`signIn`, `signOut`...) |
| Emisor de tokens | `convex/auth.config.ts` | Indica a Convex que confíe en los tokens que emite el propio deployment |
| Rutas HTTP | `convex/http.ts` | Endpoints de verificación y, con OAuth, de inicio/callback |
| Tablas | `convex/schema.ts` (`authTables`) | `users`, `authSessions`, `authAccounts`... las aporta Convex Auth |
| Usuario actual | `convex/users.ts` (`viewer`) | Query que devuelve el usuario autenticado o `null` |
| Proxy | `src/proxy.ts` | Mantiene la sesión en cookies, atiende `/api/auth` y redirige rutas protegidas |
| Provider de servidor | `src/components/providers.tsx` | `ConvexAuthNextjsServerProvider` (y el cliente en `src/lib/convex/client-provider.tsx`) |
| Sesión en el servidor | `src/lib/auth/session.ts` | `getSessionUser()` y `getSessionUserId()` |
| Interfaz | `src/features/auth/`, `src/app/(public)/login/` | Formulario de acceso y botón de cierre de sesión |
| Ruta protegida de ejemplo | `src/app/(dashboard)/dashboard/` | Panel que exige sesión |

Flujo: el navegador llama a `signIn` → `/api/auth` (proxy de Next.js) → acción de Convex → se crean la sesión y los tokens → el proxy los guarda en cookies `httpOnly` → los Server Components leen el token con `convexAuthNextjsToken()` y lo envían a Convex, que lo verifica.

## Configuración (primera vez)

1. Enlaza Convex: `npx convex dev` (ver `docs/DATABASE.md`). Déjalo corriendo.
2. Genera y guarda las claves de firma en el deployment: `npx @convex-dev/auth`. Define `JWT_PRIVATE_KEY`, `JWKS` y `SITE_URL` (usa `http://localhost:3000` en desarrollo). Para producción repite el comando con `--prod` y tu dominio en `--web-server-url`.
3. Configura las credenciales de tu método (ver abajo).
4. Ejecuta `<%= runCmd %> dev` y abre `http://localhost:3000/login`. Tras entrar llegas a `/dashboard`.

> Las variables de este módulo viven en el **deployment de Convex**, no en `.env.local`. Se listan en `.env.example` solo como referencia. Se escriben con `npx convex env set NOMBRE valor` (`--prod` para producción) o en el Dashboard → Settings → Environment Variables.

<%#if authPassword%>
## Método: email y contraseña

- Proveedor `Password` en `convex/auth.ts`; el formulario envía `email`, `password` y `flow` (`signUp` o `signIn`).
- Contraseña mínima de 8 caracteres (regla por defecto). Para endurecerla o normalizar el email pasa `profile` / `validatePasswordRequirements` a `Password({...})`.
- **No incluye verificación de email ni recuperación de contraseña** por defecto. Para añadirlas configura `verify` y `reset` con un proveedor de email; consulta la guía de Passwords en la documentación de Convex Auth.
- Convex Auth no limita intentos de acceso por sí mismo: considera un límite de frecuencia si expones el sistema públicamente.

<%#endif%>
<%#if authGoogle%>
## Método: Google

1. Google Cloud Console → APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth (aplicación web).
2. En "URI de redireccionamiento autorizados" agrega `https://TU-DEPLOYMENT.convex.site/api/auth/callback/google` (el dominio `.convex.site` es el de `CONVEX_SITE_URL`, no el `.convex.cloud`; consúltalo en el Dashboard de Convex). Repite con el deployment de producción.
3. Guarda las credenciales en Convex:
   ```bash
   npx convex env set AUTH_GOOGLE_ID "tu-client-id"
   npx convex env set AUTH_GOOGLE_SECRET "tu-client-secret"
   ```
4. Los usuarios se crean al primer acceso con el perfil de Google (email y nombre). Una misma persona con Google y contraseña puede acabar con cuentas separadas si los emails no se verifican; revisa la sección de cuentas vinculadas de la documentación antes de combinar métodos.

<%#endif%>
<%#if authMagicLink%>
## Método: enlace mágico (magic link)

- Proveedor `magic-link` (`Email` con `authorize: undefined`) en `convex/auth.ts`. El usuario escribe su email y recibe un enlace que caduca a los 15 minutos; al abrirlo queda con sesión.
- El enlace apunta a `SITE_URL`; `ConvexAuthNextjsServerProvider` detecta el parámetro `code` en cualquier página y completa el acceso.
<%#if hasResend%>
- Envío de email con **Resend** (extra seleccionado): define en Convex `AUTH_RESEND_KEY` y `AUTH_EMAIL_FROM` (remitente de un dominio verificado en Resend; ver `docs/extras/resend.md`). El código llama a la API REST de Resend con `fetch` porque `convex/` no puede importar `src/lib/email/send.ts`.
  ```bash
  npx convex env set AUTH_RESEND_KEY "re_..."
  npx convex env set AUTH_EMAIL_FROM "Mi App <acceso@tudominio.com>"
  ```
<%#else%>
- **Sin proveedor de email**: el enlace se imprime en los logs de Convex (terminal de `convex dev` o Dashboard → Logs). Es solo para desarrollo. Antes de producción reemplaza `sendAuthEmail` en `convex/auth.ts` por el envío real (por ejemplo con Resend, volviendo a generar el proyecto con ese extra).
<%#endif%>
- Algunos escáneres de correo abren los enlaces antes que la persona y los consumen. Si ocurre en tu público, usa el método de código (OTP).

<%#endif%>
<%#if authOtp%>
## Método: código por email (OTP)

- Proveedor `otp` (`Email` con código numérico de 8 dígitos) en `convex/auth.ts`. El usuario pide el código con su email y lo introduce en un segundo paso; el código caduca a los 10 minutos y solo vale con el mismo email.
- El código se genera con `crypto.getRandomValues` (sin sesgo) dentro de Convex.
<%#if hasResend%>
- Envío de email con **Resend** (extra seleccionado): define en Convex `AUTH_RESEND_KEY` y `AUTH_EMAIL_FROM` (remitente de un dominio verificado en Resend; ver `docs/extras/resend.md`). El código llama a la API REST de Resend con `fetch` porque `convex/` no puede importar `src/lib/email/send.ts`.
  ```bash
  npx convex env set AUTH_RESEND_KEY "re_..."
  npx convex env set AUTH_EMAIL_FROM "Mi App <acceso@tudominio.com>"
  ```
<%#else%>
- **Sin proveedor de email**: el código se imprime en los logs de Convex (terminal de `convex dev` o Dashboard → Logs). Es solo para desarrollo. Antes de producción reemplaza `sendAuthEmail` en `convex/auth.ts` por el envío real (por ejemplo con Resend, volviendo a generar el proyecto con ese extra).
<%#endif%>
- Convex Auth no limita por sí mismo cuántos códigos se piden ni cuántos intentos se hacen; agrega un límite de frecuencia si expones el sistema públicamente.

<%#endif%>
## Proteger rutas y datos

1. **Proxy (`src/proxy.ts`)**: agrega patrones a `isProtectedRoute` para redirigir a `/login`. Es comodidad, no seguridad.
2. **Servidor de Next.js**: en cada página, Server Action o Route Handler que dependa del usuario, comprueba la sesión:
   ```ts
   import { redirect } from "next/navigation";
   import { getSessionUserId } from "@/lib/auth/session";

   const userId = await getSessionUserId();
   if (!userId) redirect("/login");
   ```
3. **Funciones de Convex (lo que realmente protege los datos)**: cualquiera puede llamar a una función pública directamente. Verifica la identidad adentro:
   ```ts
   import { getAuthUserId } from "@convex-dev/auth/server";

   const userId = await getAuthUserId(ctx);
   if (userId === null) throw new ConvexError("No autenticado.");
   ```
   Al guardar datos de un usuario usa ese `userId` (nunca un id que envíe el cliente) y filtra las consultas por él.

`getSessionUserId(): Promise<string | null>` es el contrato que usan otros módulos del starter (por ejemplo pagos) para saber quién actúa.

## Comandos

| Comando | Uso |
| --- | --- |
| `<%= runCmd %> convex:dev` | Sincroniza las funciones (y el esquema con `authTables`) con Convex |
| `npx @convex-dev/auth` | Genera y guarda `JWT_PRIVATE_KEY`, `JWKS` y `SITE_URL` en el deployment |
| `npx convex env list` | Muestra las variables del deployment (no compartas la salida: incluye secretos) |

## Variables de entorno (en el deployment de Convex)

| Variable | Descripción |
| --- | --- |
| `SITE_URL` | URL de la aplicación (redirecciones y enlaces) |
| `JWT_PRIVATE_KEY`, `JWKS` | Par de claves con el que se firman y verifican los tokens |
<%#if authGoogle%>
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Credenciales OAuth de Google |
<%#endif%>
<%#if hasResend%>
<%#if authMagicLink%>
| `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM` | Resend: clave y remitente de los emails de acceso |
<%#endif%>
<%#if authOtp%>
| `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM` | Resend: clave y remitente de los emails de acceso |
<%#endif%>
<%#endif%>

La aplicación de Next.js solo necesita `NEXT_PUBLIC_CONVEX_URL` (ver `docs/DATABASE.md`).

## Errores frecuentes

| Síntoma | Causa y solución |
| --- | --- |
| "Missing environment variable JWT_PRIVATE_KEY" en los logs de Convex | Falta ejecutar `npx @convex-dev/auth` para ese deployment (dev y prod son independientes) |
| Redirección infinita entre `/login` y `/dashboard` | El proxy cree que hay sesión pero el servidor no: borra las cookies, revisa `SITE_URL` y `NEXT_PUBLIC_CONVEX_URL` |
| `/api/auth` devuelve 404 | `src/proxy.ts` no se está ejecutando: revisa que el archivo esté en `src/` y que su `matcher` incluya `/(api|trpc)(.*)` |
| El enlace o código nunca llega | Sin Resend se imprime en los logs de Convex; con Resend revisa `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM` y el dominio verificado |
| Tras actualizar `@convex-dev/auth` algo dejó de funcionar | Es 0.0.x: revisa el changelog de la librería y vuelve a la versión fijada si hace falta |
