# Autenticación: Supabase Auth

## Propósito

Explica cómo funciona el acceso de usuarios (método: **<%= authMethodLabel %>**), cómo configurarlo en el dashboard de Supabase y cómo proteger rutas y datos.

## Arquitectura

Usa la integración SSR oficial `@supabase/ssr`: la sesión vive en **cookies** (no en `localStorage`), así el servidor puede saber quién es el usuario.

| Archivo | Responsabilidad |
| --- | --- |
| `src/lib/supabase/config.ts` | Lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (de forma perezosa) |
| `src/lib/supabase/server.ts` | Cliente para Server Components, Server Actions y Route Handlers (uno nuevo por petición) |
| `src/lib/supabase/client.ts` | Cliente para el navegador (solo si lo necesitas; los flujos de esta plantilla no lo usan) |
| `src/lib/supabase/update-session.ts` + `src/proxy.ts` | Refrescan el token en cada petición y redirigen `/dashboard` a `/login` sin sesión. En Next.js 16 `middleware.ts` se llama `proxy.ts` |
| `src/lib/auth/session.ts` | `getCurrentUser()` y `getSessionUserId()` (contrato común de autenticación) |
| `src/features/auth/` | Acciones, esquemas Zod y formularios de acceso; `signOutAction` |
| `src/app/(public)/login/page.tsx` | Pantalla de acceso |
| `src/app/auth/callback/route.ts` | Intercambia el `code` (PKCE) por una sesión: Google, enlace mágico y confirmación de correo |
| `src/app/(dashboard)/` | Rutas protegidas; su `layout.tsx` exige sesión en el servidor |

### Supabase Auth y Supabase como base de datos

Son decisiones separadas. Aquí la base se usa con Prisma (ver `docs/DATABASE.md`) y los usuarios con Supabase Auth. Relaciona tus tablas con el usuario guardando el UUID que devuelve `getSessionUserId()` en una columna propia; no declares claves foráneas hacia el esquema `auth`, que administra Supabase.

## Autorización en el servidor

- Usa **siempre** `getCurrentUser()` / `getSessionUserId()`: llaman a `supabase.auth.getUser()`, que valida el token contra Supabase.
- **Nunca** autorices con `supabase.auth.getSession()` en el servidor: lee la cookie sin verificarla y puede estar manipulada.
- El proxy y el layout de `(dashboard)` evitan mostrar páginas sin sesión, pero **no protegen Server Actions ni Route Handlers**: cada uno debe comprobar el usuario y validar su entrada con Zod.
- Filtra los datos con el id obtenido en el servidor, nunca con uno que envíe el cliente.

```ts
import { getSessionUserId } from "@/lib/auth/session";

export async function misPedidos() {
  const userId = await getSessionUserId();
  if (!userId) throw new AppError("No autenticado.", 401, "unauthorized");
  // ... consulta filtrando por userId
}
```

## Configuración

### 1. Variables de entorno

```bash
cp .env.example .env.local
```

| Variable | Dónde obtenerla |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Connect → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dashboard → Project Settings → API Keys → **Publishable key** (`sb_publishable_...`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` en desarrollo; tu dominio en producción |

Ambas de Supabase son públicas por diseño. **Nunca** uses la clave `secret`/`service_role` con este patrón ni con prefijo `NEXT_PUBLIC_`: salta todas las políticas RLS. Si tu proyecto aún usa las claves antiguas (`anon`), también sirven en la misma variable, pero Supabase recomienda migrar a las publishable.

### 2. URLs permitidas (obligatorio para todos los métodos)

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: el valor de `NEXT_PUBLIC_APP_URL`.
- **Redirect URLs**: añade `http://localhost:3000/auth/callback` y la versión de producción `https://tu-dominio.com/auth/callback`. Si no está en la lista, Supabase ignora el destino y redirige a Site URL.

<%#if authPassword%>
### Método: correo y contraseña

1. Dashboard → **Authentication → Sign In / Providers → Email**: habilitado (viene activo por defecto).
2. **Confirm email**: recomendado en producción. Con él, tras registrarse el usuario recibe un correo con un enlace (que vuelve a `/auth/callback`) y no puede iniciar sesión hasta confirmarlo. En desarrollo puedes desactivarlo para entrar al instante.
3. **Minimum password length**: la plantilla exige 8 caracteres al registrarse (`src/features/auth/schemas/password-schema.ts`); mantén ambos valores alineados.
4. Correo: el SMTP integrado de Supabase solo envía a miembros del equipo y con límites bajos. Para enviar a usuarios reales configura un SMTP propio en **Authentication → Emails → SMTP Settings**.

Pantalla: `/login` (iniciar sesión) y `/login?modo=registro` (crear cuenta). Código: `src/features/auth/actions/password.ts`.

<%#endif%>
<%#if authGoogle%>
### Método: Google

1. En [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials → Create credentials → OAuth client ID** (tipo *Web application*). Si es tu primer cliente, configura antes la pantalla de consentimiento.
2. **Authorized redirect URIs**: añade `https://PROJECT_REF.supabase.co/auth/v1/callback` (la URL exacta aparece en Supabase al habilitar el proveedor). **Authorized JavaScript origins**: tu `NEXT_PUBLIC_APP_URL`.
3. Copia el *Client ID* y el *Client secret*.
4. Dashboard de Supabase → **Authentication → Sign In / Providers → Google** → habilítalo y pega ambos valores. El Client secret vive solo en Supabase: no se agrega a `.env`.
5. Comprueba que `/auth/callback` esté en las Redirect URLs (paso 2 de arriba).

Flujo: el botón envía una Server Action (`src/features/auth/actions/google.ts`) → Google → Supabase → `/auth/callback?code=...` → sesión en cookies → `/dashboard`.

<%#endif%>
<%#if authMagicLink%>
### Método: magic link (enlace por correo)

1. Dashboard → **Authentication → Sign In / Providers → Email** habilitado.
2. Plantillas en **Authentication → Emails**: las plantillas por defecto *Magic Link* y *Confirm signup* ya incluyen `{{ .ConfirmationURL }}`, que funciona con esta plantilla. Mantén ese enlace si las personalizas.
3. Configura un SMTP propio para producción (**Authentication → Emails → SMTP Settings**); el integrado tiene límites muy bajos.
4. El enlace debe abrirse en el **mismo navegador** donde se solicitó (flujo PKCE); si no, `/auth/callback` redirige a `/login?error=callback`.

Código: `src/features/auth/actions/magic-link.ts`. Si el correo no existe, `signInWithOtp` crea la cuenta; para impedirlo pasa `shouldCreateUser: false` en esa llamada.

<%#endif%>
<%#if authOtp%>
### Método: código OTP por correo

1. Dashboard → **Authentication → Sign In / Providers → Email** habilitado. Allí puedes cambiar la longitud (6 a 10 dígitos) y la caducidad del código; la validación de `src/features/auth/schemas/otp-schema.ts` admite 6 a 10.
2. **Authentication → Emails → Templates**: para que el correo traiga el **código** en vez de un enlace, las plantillas *Magic Link* (usuarios existentes) y *Confirm signup* (usuarios nuevos) deben mostrar `{{ .Token }}`, por ejemplo: `Tu código es: {{ .Token }}`.
3. Configura un SMTP propio para producción (**Authentication → Emails → SMTP Settings**).

Flujo: `sendOtpCodeAction` envía el código y `verifyOtpCodeAction` lo verifica con `verifyOtp({ type: "email" })` (`src/features/auth/actions/otp.ts`). No usa `/auth/callback`.

<%#endif%>
## Comandos

```bash
<%= runCmd %> dev        # desarrollo: http://localhost:3000/login
<%= runCmd %> typecheck
<%= runCmd %> build
```

## Cerrar sesión

El botón "Salir" del header llama a `signOutAction` (`src/features/auth/actions/sign-out.ts`), que cierra solo la sesión de este dispositivo (`scope: "local"`).

## Errores frecuentes

- *Falta NEXT_PUBLIC_SUPABASE_URL o ...PUBLISHABLE_KEY*: completa `.env.local` y reinicia `<%= runCmd %> dev`.
- *Vuelve a /login?error=callback*: la URL `/auth/callback` no está en Redirect URLs, el enlace caducó o se abrió en otro navegador.
- *Redirige a localhost en producción*: Site URL o `NEXT_PUBLIC_APP_URL` siguen con el valor de desarrollo.
- *Se cierra la sesión sola*: no ejecutes código entre `createServerClient` y `getUser()` en `update-session.ts`, y si devuelves otra respuesta en el proxy copia sus cookies.
- *Email rate limit exceeded*: el SMTP integrado de Supabase tiene un límite muy bajo; configura SMTP propio.
