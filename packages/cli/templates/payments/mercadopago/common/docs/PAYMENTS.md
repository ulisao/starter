# Pagos con Mercado Pago

## Propósito

Esta aplicación cobra con Mercado Pago (tipo de cobro de este proyecto: `<%= paymentType %>`) y registra cada cobro en PostgreSQL con Prisma. Está pensada como base funcional: la mecánica segura (firma, consulta server-side, idempotencia) ya está implementada y tú completas las decisiones de negocio.

## Arquitectura

| Pieza | Archivo |
| --- | --- |
| Cliente del SDK | `src/lib/payments/mercadopago.ts` |
| Verificación de firma (función pura) | `src/lib/payments/signature.ts` |
| Catálogo de precios (servidor) | `src/services/payments/catalog.ts` |
| Acciones de negocio al aprobar | `src/services/payments/hooks.ts` |
| Estado de pagos | `src/services/payments/transactions.ts` |
<%#if payOneTime%>
| Creación del checkout | `src/services/payments/checkout-service.ts` y `src/app/api/payments/checkout/route.ts` |
| Páginas de resultado | `src/app/(public)/payments/[outcome]/page.tsx` |
<%#endif%>
<%#if paySubscription%>
| Suscripciones | `src/services/payments/subscriptions.ts` |
| API de suscripciones | `src/app/api/payments/subscriptions/route.ts` y `.../[id]/route.ts` (cancelar) |
| Página de retorno | `src/app/(public)/payments/subscription/page.tsx` |
<%#endif%>
| Webhook | `src/app/api/webhooks/mercadopago/route.ts` y `src/services/payments/webhook-service.ts` |
<%#if paySubscription%>
| Modelos Prisma | `prisma/schema/payments.prisma`, `prisma/schema/payments-subscriptions.prisma` |
<%#else%>
| Modelos Prisma | `prisma/schema/payments.prisma` |
<%#endif%>
| UI de ejemplo | `src/features/payments/` y `src/app/(public)/payments/` |

Flujo:

<%#if payOneTime%>
1. El cliente pide un checkout enviando **solo** `productId` y un UUID de idempotencia.
2. El servidor lee el precio del catálogo, registra una transacción `PENDING` y crea la preferencia (la clave idempotente es el id de la transacción).
3. El comprador paga en Mercado Pago y vuelve a `/payments/success|pending|failure`. Esas páginas **solo informan**.
4. Mercado Pago llama al webhook. El servidor verifica la firma, consulta el pago a la API y actualiza la transacción (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`). Solo entonces corre `onPaymentApproved`.
<%#endif%>
<%#if paySubscription%>
1. El cliente pide una suscripción enviando **solo** `planId`, su email y un UUID de idempotencia.
2. El servidor lee monto y frecuencia del catálogo, registra la suscripción `PENDING` y crea un `preapproval` en Mercado Pago.
3. El comprador autoriza el cobro recurrente en Mercado Pago y vuelve a `/payments/subscription` (página que **solo informa**).
4. Mercado Pago notifica `subscription_preapproval` (cambios de estado: `authorized`, `paused`, `cancelled`) y `subscription_authorized_payment` (cada cobro periódico, aprobado o rechazado). El servidor verifica la firma, consulta el recurso a la API y actualiza `payment_subscriptions` y `payment_transactions`.
<%#endif%>

## Decisiones de negocio que debes completar

- [ ] **Catálogo y precios** en `src/services/payments/catalog.ts`: productos o planes, montos y moneda de tu cuenta (ARS, BRL, CLP, COP, MXN, PEN, UYU...).
- [ ] **Qué ocurre al aprobarse un pago** en `src/services/payments/hooks.ts` (habilitar acceso, enviar recibo, descontar stock...). Hoy solo escribe un log.
<%#if paySubscription%>
- [ ] **Qué ocurre cuando una suscripción cambia de estado** (`onSubscriptionChanged`): activar o revocar acceso, avisar al usuario cuando un cobro es rechazado, etc.
<%#endif%>
<%#if hasAuth%>
- [ ] **¿Se puede pagar sin iniciar sesión?** Por defecto sí (`userId` queda en `null`). Si no, devuelve 401 en la ruta cuando `getSessionUserId()` sea `null`.
<%#else%>
- [ ] **Autenticación:** este proyecto no la tiene, así que los pagos NO se asocian a ningún usuario y no puedes saber quién compró desde la base de datos. Para vincular pagos a usuarios, agrega autenticación con `baretta add` o a mano y pasa `userId` desde el servidor.
<%#endif%>
- [ ] **Reembolsos, facturación y emails de recibo** si tu negocio los necesita (no incluidos).

## Configuración

1. Crea una aplicación en https://www.mercadopago.com/developers/panel/app (tipo «Pagos online»).
2. **Credenciales de prueba:** en la aplicación → Credenciales de prueba, copia el *Access Token* a `MERCADOPAGO_ACCESS_TOKEN` en `.env.local`. Con credenciales de prueba todo ocurre en sandbox: no se mueve dinero real. Para pagar necesitas **cuentas de prueba** de comprador y vendedor (panel → Cuentas de prueba); no uses tu cuenta real.
3. **Webhook:** en la aplicación → Webhooks → Configurar notificaciones, define la URL `https://TU-DOMINIO/api/webhooks/mercadopago` y marca los eventos «Pagos» y, si usas suscripciones, «Planes y suscripciones» (suscripciones y pagos recurrentes). Copia la **clave secreta** que muestra el panel a `MERCADOPAGO_WEBHOOK_SECRET`. Configura la URL de prueba y la de producción por separado.
4. Aplica el esquema de base de datos: `<%= runCmd %> db:migrate -- --name pagos`.
5. En local necesitas un túnel HTTPS para recibir webhooks; ver `src/features/payments/AGENTS.md`.
6. **Producción:** usa credenciales de producción, el dominio real en `NEXT_PUBLIC_APP_URL` y configura de nuevo el webhook con su clave secreta de producción.

## Comandos

| Comando | Para qué |
| --- | --- |
| `<%= runCmd %> db:migrate -- --name pagos` | Crea las tablas de pagos. |
| `<%= runCmd %> db:studio` | Revisa transacciones y estados. |
| `<%= runCmd %> dev` | Servidor de desarrollo. |

## Variables de entorno

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `MERCADOPAGO_ACCESS_TOKEN` | secreta | Token privado del SDK. Solo servidor. |
| `MERCADOPAGO_WEBHOOK_SECRET` | secreta | Clave para verificar `x-signature`. Solo servidor. |
| `NEXT_PUBLIC_APP_URL` | pública | Base de las URLs de retorno y de `notification_url`. Para recibir webhooks y `auto_return` debe ser https y pública. |

No se usa clave pública (*Public Key*) porque el checkout es redirigido (Checkout Pro); si integras Checkout Bricks en el navegador, agrégala como `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (la clave pública sí puede exponerse; el access token nunca).

## Seguridad

- El precio lo decide siempre el servidor; el cliente solo envía identificadores.
- Una página de éxito no aprueba nada: solo el webhook verificado + la consulta a la API cambia estados.
- Firma: HMAC SHA-256 de `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` comparada en tiempo constante (`verifyWebhookSignature`). Una petición sin firma válida recibe 401.
- Idempotencia al crear (clave idempotente) y al procesar (actualizaciones condicionales y `mpPaymentId` único).
- Ninguna ruta de pagos tiene límite de tasa: considera protegerlas antes de producción.

## Ejemplos

Probar la verificación de firma (función pura) con el runner de Node:

```ts
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "@/lib/payments/signature";

const ts = "1700000000000";
const manifest = `id:abc123;request-id:req-1;ts:${ts};`;
const v1 = createHmac("sha256", "secreto").update(manifest).digest("hex");
verifyWebhookSignature({ secret: "secreto", signatureHeader: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "ABC123" }); // true
```

## Errores frecuentes

- **El webhook responde 401:** la clave secreta no coincide (¿usas la de otra aplicación o la de producción en pruebas?) o se llamó sin las cabeceras de Mercado Pago.
- **El pago aparece `PENDING` para siempre:** Mercado Pago no pudo llegar al webhook (URL local sin túnel, no https o no configurada en el panel). Revisa «Notificaciones» en el panel.
- **`auto_return` o `notification_url` no se envían:** `NEXT_PUBLIC_APP_URL` no es https. Es intencional en local.
- **Falta `MERCADOPAGO_ACCESS_TOKEN`:** el servicio falla al primer uso, no al compilar. Configúralo en `.env.local`.
- **«El monto o la moneda del pago no coinciden»:** alguien cambió el catálogo entre la creación y el pago, o la moneda no corresponde a tu cuenta.
<%#if paySubscription%>
- **`payer_email` rechazado en pruebas:** con credenciales de prueba usa el email de la cuenta de prueba compradora.
<%#endif%>
