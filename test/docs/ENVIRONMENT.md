# Variables de entorno

## Propósito

Lista todas las variables que usa el proyecto, cuáles son secretas y de dónde obtenerlas. La fuente de verdad es `.env.example`.

## Uso

```bash
cp .env.example .env.local
```

`.env.local` está en `.gitignore`: **nunca lo subas al repositorio**.

## Reglas

- Las variables con prefijo `NEXT_PUBLIC_` se incluyen en el JavaScript del navegador: nunca pongas secretos ahí.
- Las secretas se leen solo en servidor con `requireEnv("NOMBRE")` (`src/lib/env.ts`).
- Vercel y Docker no comparten configuración operativa: en Vercel se cargan en *Project Settings → Environment Variables*; en Docker mediante `env_file` o variables del orquestador (ver `docs/DEPLOYMENT.md`).

## Variables

| Variable | Tipo | Módulo | Descripción |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | pública/config | base | URL pública de la aplicación (sin barra final). Se usa para URLs absolutas y redirecciones. |
| `NEXT_PUBLIC_CONVEX_URL` | pública/config | backend-convex | URL de tu deployment de Convex. Es pública: el navegador la usa para conectarse. |
| `CONVEX_DEPLOYMENT` | pública/config | backend-convex | Deployment de desarrollo al que apunta la CLI de Convex (no la lee la aplicación en runtime). |
| `CLERK_JWT_ISSUER_DOMAIN` | pública/config | auth-clerk-convex | Variable del deployment de Convex (npx convex env set), NO se lee desde .env.local. Dominio emisor de los tokens de Clerk (Frontend API URL). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | pública/config | auth-clerk | Clave pública (publishable key) de tu aplicación en Clerk. |
| `CLERK_SECRET_KEY` | 🔒 secreta | auth-clerk | Clave secreta de Clerk, usada por el servidor para verificar sesiones. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | pública/config | auth-clerk | Ruta de tu página de inicio de sesión. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | pública/config | auth-clerk | Ruta de tu página de registro. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | pública/config | auth-clerk | Destino tras iniciar sesión cuando no hay una redirección previa. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | pública/config | auth-clerk | Destino tras registrarse cuando no hay una redirección previa. |
| `MERCADOPAGO_ACCESS_TOKEN` | 🔒 secreta | payments-mercadopago | Access token privado de Mercado Pago. Con credenciales de prueba (TEST-...) todo ocurre en sandbox. |
| `MERCADOPAGO_WEBHOOK_SECRET` | 🔒 secreta | payments-mercadopago | Clave secreta con la que Mercado Pago firma las notificaciones (cabecera x-signature). |
| `CONVEX_PAYMENTS_SECRET` | 🔒 secreta | payments-mercadopago-convex | Secreto compartido que protege las funciones de pagos de Convex (convex/payments.ts). Úsalo con el MISMO valor en .env.local y en el deployment de Convex (npx convex env set). |
| `UPSTASH_REDIS_REST_URL` | 🔒 secreta | extra-rate-limit | URL REST de tu base Redis en Upstash. Obligatoria en producción para limitar solicitudes. |
| `UPSTASH_REDIS_REST_TOKEN` | 🔒 secreta | extra-rate-limit | Token REST de Upstash (lectura/escritura). |
| `RESEND_API_KEY` | 🔒 secreta | extra-resend | API key de Resend para enviar emails desde el servidor. |
| `EMAIL_FROM` | pública/config | extra-resend | Remitente de los emails. Debe pertenecer a un dominio verificado en Resend. |

## Errores frecuentes

- *"Falta la variable de entorno X"*: no está definida en `.env.local` (desarrollo) o en el panel del hosting (producción).
- Cambiaste `.env.local` y no se nota: reinicia `npm run dev`.
