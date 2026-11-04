# Autenticación — Better Auth sobre Convex

## Propósito
Inicio de sesión y registro con **Better Auth** ejecutándose dentro de Convex mediante el componente
oficial [`@convex-dev/better-auth`](https://labs.convex.dev/better-auth). Método configurado:
**<%= authMethodLabel %>**. Usuarios, sesiones y claves viven en el componente de Better Auth de tu
deployment (no en `convex/schema.ts`); Next.js solo reenvía `/api/auth/*` y lee el token de sesión.

## Arquitectura

| Archivo | Rol |
| --- | --- |
| `convex/convex.config.ts` | Instala el componente de Better Auth en el deployment. |
| `convex/auth.ts` | Configuración de Better Auth (`createAuth`), `authComponent` y la query `getCurrentUser`. |
| `convex/auth.config.ts` | Declara el emisor de los tokens que Convex valida. |
| `convex/http.ts` | Registra las rutas HTTP de Better Auth en el dominio `.convex.site`. |
| `src/lib/auth/server.ts` | `getAuthServer()`: handler, token y consultas autenticadas desde Next.js (perezoso). |
| `src/lib/auth/session.ts` | `getSessionUser()`, `getSessionUserId()` (contrato entre módulos) y `requireUserId()`. |
| `src/lib/auth/auth-client.ts` | Cliente de Better Auth para componentes de navegador. |
| `src/lib/convex/client-provider.tsx` | `ConvexBetterAuthProvider`: Convex recibe el token de la sesión. |
| `src/app/api/auth/[...all]/route.ts` | Reenvía `/api/auth/*` al deployment de Convex. |
| `src/proxy.ts` | Chequeo **optimista** de cookie para `/dashboard`. **No es una barrera de seguridad.** |
| `src/app/(dashboard)/layout.tsx` | Autorización real de las rutas protegidas. |

Regla de oro: **autoriza siempre en el servidor**. Cualquier función pública de Convex puede llamarse
directamente desde un navegador, así que cada `query`/`mutation`/`action` que dependa del usuario debe
comprobarlo dentro de su handler (ver `getCurrentUser` en `convex/auth.ts`).

## Configuración

1. **Enlaza el deployment.** Ejecuta `<%= runCmd %> convex:dev` (crea o enlaza el proyecto y sube las funciones, incluido el componente).
2. **Variables de Next.js** (`.env.local`): `NEXT_PUBLIC_CONVEX_URL` (la escribe `convex dev`) y
   `NEXT_PUBLIC_CONVEX_SITE_URL`, la URL del mismo deployment que termina en `.convex.site`
   (Convex Dashboard → Settings → URL & Deploy Key → *HTTP Actions URL*).
3. **Variables del deployment de Convex** (no van en `.env.local`):
   ```bash
   <%= execCmd %> convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
   <%= execCmd %> convex env set SITE_URL http://localhost:3000
   ```
   `SITE_URL` es la URL pública de tu aplicación Next.js; en producción usa tu dominio y repite los
   comandos contra el deployment de producción (`--prod`). Si cambias `BETTER_AUTH_SECRET`, las sesiones activas se invalidan.
<%#if authGoogle%>
4. **Credenciales de Google.**
   1. Entra a [Google Cloud Console](https://console.cloud.google.com/) y crea o elige un proyecto.
   2. *APIs y servicios → Pantalla de consentimiento de OAuth*: configúrala (tipo externo, nombre, email).
   3. *APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth* (tipo *Aplicación web*).
   4. En *URI de redireccionamiento autorizados* agrega `http://localhost:3000/api/auth/callback/google`
      y, en producción, `https://TU-DOMINIO/api/auth/callback/google`.
   5. Guarda las credenciales en Convex: `<%= execCmd %> convex env set GOOGLE_CLIENT_ID ...` y `<%= execCmd %> convex env set GOOGLE_CLIENT_SECRET ...`.
<%#endif%>
<%#if authPassword%>

**Contraseñas:** mínimo 8 caracteres, almacenadas con hash. Para exigir email verificado activa
`requireEmailVerification` en `convex/auth.ts` y configura el envío del correo de verificación.
<%#endif%>
<%#if authMagicLink%>

**Magic link:** el usuario recibe un enlace de un solo uso (expira en 5 minutos). La función
`deliverEmail()` de `convex/auth.ts` envía el correo.
<%#endif%>
<%#if authOtp%>

**OTP por email:** el usuario recibe un código de 6 dígitos (expira en 5 minutos). La función
`deliverEmail()` de `convex/auth.ts` envía el correo.
<%#endif%>
<%#if authMagicLink%>
<%#if hasResend%>
Los correos salen por la API REST de Resend, llamada desde Convex. Define en el deployment
`AUTH_RESEND_KEY` y `AUTH_EMAIL_FROM` (`<%= execCmd %> convex env set ...`).
<%#else%>
No hay proveedor de email: el contenido solo se imprime en los logs de Convex. Para producción
agrega el extra Resend o conecta tu proveedor en `deliverEmail()`.
<%#endif%>
<%#endif%>
<%#if authOtp%>
<%#if hasResend%>
Los correos salen por la API REST de Resend, llamada desde Convex. Define en el deployment
`AUTH_RESEND_KEY` y `AUTH_EMAIL_FROM` (`<%= execCmd %> convex env set ...`).
<%#else%>
No hay proveedor de email: el contenido solo se imprime en los logs de Convex. Para producción
agrega el extra Resend o conecta tu proveedor en `deliverEmail()`.
<%#endif%>
<%#endif%>

## Variables de entorno

| Variable | Dónde | Secreta | Uso |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` | No | URL `.convex.cloud` del deployment. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `.env.local` | No | URL `.convex.site` del deployment (rutas HTTP de Better Auth). |
| `BETTER_AUTH_SECRET` | Convex | Sí | Firma de sesiones y tokens. |
| `SITE_URL` | Convex | No | URL pública de la aplicación Next.js. |
<%#if authGoogle%>
| `GOOGLE_CLIENT_ID` | Convex | Sí | OAuth de Google. |
| `GOOGLE_CLIENT_SECRET` | Convex | Sí | OAuth de Google. |
<%#endif%>
<%#if authMagicLink%>
<%#if hasResend%>
| `AUTH_RESEND_KEY` | Convex | Sí | API key de Resend. |
| `AUTH_EMAIL_FROM` | Convex | No | Remitente de los correos. |
<%#endif%>
<%#endif%>
<%#if authOtp%>
<%#if hasResend%>
| `AUTH_RESEND_KEY` | Convex | Sí | API key de Resend. |
| `AUTH_EMAIL_FROM` | Convex | No | Remitente de los correos. |
<%#endif%>
<%#endif%>

## Ejemplos

En el servidor de Next.js (Server Component, Server Action o Route Handler):

```ts
import { requireUserId } from "@/lib/auth/session";

export async function GET() {
  const userId = await requireUserId(); // lanza AppError 401 si no hay sesión
  // consulta SOLO datos de userId
}
```

Dentro de una función de Convex:

```ts
import { authComponent } from "./auth";

export const miFuncion = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx); // lanza si no hay sesión
    // filtra los datos por user._id
  },
});
```

## Errores frecuentes

- **`Falta la variable de entorno NEXT_PUBLIC_CONVEX_SITE_URL`**: añádela a `.env.local` (URL que termina en `.convex.site`).
- **`No auth provider found matching the given token`**: `convex/auth.config.ts` no está desplegado; ejecuta `<%= runCmd %> convex:dev`.
- **Error de `baseURL`/`SITE_URL`**: define `SITE_URL` en el deployment de Convex (no en `.env.local`).
- **`redirect_uri_mismatch` (Google)**: la URI de redirección en Google Cloud debe coincidir exactamente con `SITE_URL` + `/api/auth/callback/google`.
- **Bucle entre /login y /dashboard**: una cookie vencida pasa el proxy pero no el layout; cierra sesión o borra las cookies.
- **Versiones**: `@convex-dev/better-auth` exige `better-auth` 1.6.x; no lo actualices a 1.7 hasta que el componente lo soporte.
