# Resend (emails transaccionales)

## Propósito

Enviar emails desde el servidor (confirmaciones, avisos, magic links) con [Resend](https://resend.com). El resto del proyecto solo conoce la función `sendEmail`; el SDK queda encapsulado.

## Arquitectura

- `src/lib/email/send.ts`: exporta `sendEmail({ to, subject, text, html? }): Promise<void>`. Es `server-only`.
- Las credenciales se leen con `requireEnv` **al enviar**, no al importar: `next build` funciona sin ellas.
- Si Resend devuelve un error, `sendEmail` lanza un `Error`; el llamador decide si lo traduce a `AppError`.

## Configuración

1. Crea una cuenta en resend.com.
2. **API key**: API Keys, Create API Key (permiso "Sending access"), y cópiala en `RESEND_API_KEY`.
3. **Dominio**: Domains, Add Domain, y agrega en tu DNS los registros SPF, DKIM (y opcionalmente DMARC) que Resend indica. Espera a que el estado sea "Verified".
4. Define `EMAIL_FROM` con una dirección de ese dominio, por ejemplo `Mi App <no-reply@miapp.com>`.

Mientras no verifiques un dominio, Resend solo permite enviar con `onboarding@resend.dev` y únicamente al email de tu propia cuenta.

## Variables de entorno

| Variable | Secreta | Descripción |
| --- | --- | --- |
| `RESEND_API_KEY` | Sí | API key. Nunca con `NEXT_PUBLIC_`. |
| `EMAIL_FROM` | No | Remitente con dominio verificado. |

## Ejemplo de uso

```ts
// src/services/welcome-email.ts
import "server-only";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";

const emailSchema = z.email();

export async function sendWelcomeEmail(rawEmail: string) {
  const to = emailSchema.parse(rawEmail);
  await sendEmail({
    to,
    subject: "Bienvenido",
    text: "Gracias por registrarte.",
    html: "<p>Gracias por registrarte.</p>",
  });
}
```

Combínalo con el extra de rate limiting si el envío se dispara desde un formulario público, para evitar abuso.

## Errores frecuentes

- `Falta la variable de entorno RESEND_API_KEY`: define las variables en `.env.local` (y en el panel de tu hosting).
- `The domain is not verified` o `You can only send testing emails to your own email address`: verifica el dominio y usa un `EMAIL_FROM` de ese dominio.
- Los emails caen en spam: revisa SPF/DKIM/DMARC; `sendEmail` siempre envía una versión `text`.
