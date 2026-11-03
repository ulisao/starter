# Autenticación — Better Auth

## Propósito
Inicio de sesión y registro con **Better Auth** sobre la base de datos del proyecto (Prisma).
Método configurado: **<%= authMethodLabel %>**. Las sesiones viven en la base de datos y se
envían en una cookie `httpOnly`.

## Arquitectura

| Archivo | Rol |
| --- | --- |
| `src/lib/auth/auth.ts` | Configuración de servidor (`getAuth()`, perezosa: no lee variables al compilar). |
| `src/lib/auth/auth-client.ts` | Cliente para componentes de navegador. |
| `src/lib/auth/session.ts` | `getSession()`, `getSessionUserId()` (contrato entre módulos) y `requireUserId()`. |
| `src/app/api/auth/[...all]/route.ts` | Endpoints HTTP de Better Auth (`/api/auth/*`). |
| `src/proxy.ts` | Chequeo **optimista** de cookie para `/dashboard` (Next.js 16). **No es una barrera de seguridad.** |
| `src/app/(dashboard)/layout.tsx` | Autorización real de las rutas protegidas. |
| `src/app/api/me/route.ts` | Ejemplo de Route Handler protegido. |
| `src/features/auth/` | Formulario de login/registro y menú de usuario del header. |
| `prisma/schema/auth.prisma` | Modelos `User`, `Session`, `Account`, `Verification`. |

Regla de oro: **autoriza siempre en el servidor**. El proxy y el cliente solo mejoran la experiencia;
cualquier Server Action o Route Handler protegido debe llamar a `requireUserId()` y filtrar los
datos por ese id.

## Configuración

1. **Secreto.** Genera una clave aleatoria y ponla en `.env.local`:
   ```bash
   openssl rand -base64 32
   ```
   Pégala en `BETTER_AUTH_SECRET`. En producción usa un valor distinto y guárdalo en el gestor de
   secretos de tu hosting. Si lo cambias, las sesiones activas se invalidan.
2. **URL.** `BETTER_AUTH_URL=http://localhost:3000` en desarrollo; tu dominio real en producción.
3. **Base de datos.** Con `DATABASE_URL` configurada, crea las tablas:
   ```bash
   <%= runCmd %> db:migrate -- --name auth_inicial
   ```
   En producción usa `<%= runCmd %> db:deploy`.
<%#if authGoogle%>
4. **Credenciales de Google.**
   1. Entra a [Google Cloud Console](https://console.cloud.google.com/) y crea o elige un proyecto.
   2. *APIs y servicios → Pantalla de consentimiento de OAuth*: configúrala (tipo externo, nombre, email).
   3. *APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth* (tipo *Aplicación web*).
   4. En *URI de redireccionamiento autorizados* agrega `http://localhost:3000/api/auth/callback/google`
      y, en producción, `https://TU-DOMINIO/api/auth/callback/google`.
   5. Copia el ID y el secreto en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
<%#endif%>
<%#if authPassword%>

**Contraseñas:** mínimo 8 caracteres, almacenadas con hash (scrypt). Para exigir email verificado
activa `requireEmailVerification` en `src/lib/auth/auth.ts` y configura el envío del correo de verificación.
<%#endif%>
<%#if authMagicLink%>

**Magic link:** el usuario recibe un enlace de un solo uso (expira en 5 minutos). La función
`deliverEmail()` de `src/lib/auth/auth.ts` envía el correo.
<%#endif%>
<%#if authOtp%>

**OTP por email:** el usuario recibe un código de 6 dígitos (expira en 5 minutos). La función
`deliverEmail()` de `src/lib/auth/auth.ts` envía el correo.
<%#endif%>
<%#if authMagicLink%>
<%#if hasResend%>
Los correos salen por `sendEmail` del extra Resend (`src/lib/email/send.ts`).
<%#else%>
No hay proveedor de email: en desarrollo el contenido se imprime en la consola del servidor y en
producción el envío **falla** a propósito. Agrega el extra Resend o conecta tu proveedor en `deliverEmail()`.
<%#endif%>
<%#endif%>
<%#if authOtp%>
<%#if hasResend%>
Los correos salen por `sendEmail` del extra Resend (`src/lib/email/send.ts`).
<%#else%>
No hay proveedor de email: en desarrollo el contenido se imprime en la consola del servidor y en
producción el envío **falla** a propósito. Agrega el extra Resend o conecta tu proveedor en `deliverEmail()`.
<%#endif%>
<%#endif%>

## Comandos

| Comando | Para qué |
| --- | --- |
| `<%= runCmd %> db:migrate` | Crea y aplica migraciones en desarrollo. |
| `<%= runCmd %> db:deploy` | Aplica migraciones en producción. |
| `<%= runCmd %> db:studio` | Explora usuarios y sesiones. |

## Variables de entorno

| Variable | Secreta | Uso |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Sí | Firma de sesiones y tokens. |
| `BETTER_AUTH_URL` | No | URL base para callbacks y enlaces. |
<%#if authGoogle%>
| `GOOGLE_CLIENT_ID` | Sí | OAuth de Google. |
| `GOOGLE_CLIENT_SECRET` | Sí | OAuth de Google. |
<%#endif%>

## Ejemplos

Proteger un Route Handler o Server Action:

```ts
import { requireUserId } from "@/lib/auth/session";

export async function GET() {
  const userId = await requireUserId(); // lanza AppError 401 si no hay sesión
  // consulta SOLO datos de userId
}
```

Leer el usuario en un Server Component: `const session = await getSession();`.
Proteger más rutas: colócalas dentro de `src/app/(dashboard)/` y, si quieres la redirección rápida,
agrégalas al matcher de `src/proxy.ts`.

## Errores frecuentes

- **`Falta la variable de entorno BETTER_AUTH_SECRET`**: completa `.env.local` (ver Configuración).
- **`The table public.users does not exist`**: falta ejecutar `<%= runCmd %> db:migrate`.
- **`redirect_uri_mismatch` (Google)**: la URI de redirección en Google Cloud debe coincidir exactamente
  con `BETTER_AUTH_URL` + `/api/auth/callback/google`.
- **Bucle entre /login y /dashboard**: una cookie vencida pasa el proxy pero no el layout; cierra sesión o borra las cookies.
- **Cambiaste los modelos de `auth.prisma`**: crea una migración y reinicia el servidor de desarrollo.
