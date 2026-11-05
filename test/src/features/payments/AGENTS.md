# AGENTS.md — dominio de pagos (Mercado Pago)

Instrucciones para agentes de programación que modifiquen cualquier archivo de pagos. Complementan el `AGENTS.md` de la raíz y `docs/PAYMENTS.md`. Cuando haya conflicto, prevalece la regla más estricta.

## Mapa del dominio

- `src/lib/payments/mercadopago.ts` — configuración del SDK (token privado, lectura perezosa).
- `src/lib/payments/signature.ts` — verificación de firma del webhook. Función pura, sin I/O.
- `src/services/payments/catalog.ts` — **precios** de productos o planes. Única fuente de montos.
- `src/services/payments/hooks.ts` — qué ocurre al aprobarse un cobro (lógica de negocio).
- `src/services/payments/transactions.ts` — consulta el pago a Mercado Pago y aplica su estado.
- `src/services/payments/webhook-service.ts` — enruta cada notificación verificada.
- `src/app/api/webhooks/mercadopago/route.ts` — webhook: verifica firma y delega.
- `prisma/schema/payments.prisma` — tabla `payment_transactions`.

## Reglas obligatorias

1. **Nunca confíes en el cliente.** El navegador solo envía identificadores (`productId`/`planId`, email). Montos, moneda y frecuencia salen de `catalog.ts`. Nunca agregues un campo de precio a un body de petición.
2. **Nunca apruebes por una redirección.** Las páginas `back_urls` solo informan. El único camino que cambia un estado es: webhook con firma válida → consulta a la API de Mercado Pago → actualización en la base de datos.
3. **Verifica la firma primero.** Ningún código de procesamiento puede ejecutarse antes de `verifyWebhookSignature`. No registres ni uses el cuerpo de una notificación no verificada. De la notificación solo se usa el id del recurso; el estado se consulta a la API.
4. **Idempotencia.**
   - Al crear: cada intento lleva un UUID (`idempotencyKey`, único en base de datos) y la llamada al SDK usa `requestOptions.idempotencyKey` con el id de la fila. Reintentar no duplica cobros.
   - Al procesar: Mercado Pago reenvía notificaciones. Las actualizaciones son condicionales (`updateMany` con `status: { not: nuevoEstado }`) y los hooks de negocio solo corren cuando hubo una transición real (`count === 1`). `mpPaymentId` es único. No cambies esto por un `update` incondicional.
5. **El monto se compara.** `syncPayment` rechaza pagos cuyo monto o moneda difieran de lo registrado. No elimines esa comprobación.
6. **Secretos.** `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` solo se leen con `requireEnv` en código de servidor, de forma perezosa. Nunca con prefijo `NEXT_PUBLIC_`, nunca en componentes cliente, nunca en logs.
7. **Responde bien al webhook.** 401 si la firma es inválida, 200 si se procesó o se ignoró, 500 si falló algo reintentable (Mercado Pago reintentará).
8. **Sin relaciones con modelos de otros módulos.** `userId` es un texto opcional sin clave foránea; no lo cambies a una relación.
9. El usuario se obtiene siempre en el servidor con `getSessionUserId()` (`@/lib/auth/session`). Nunca aceptes un `userId` del cliente.

## Cómo probar webhooks en local

Mercado Pago no puede llamar a `localhost`. Expón tu servidor con un túnel HTTPS:

1. Inicia la app: `npm run dev`.
2. Abre un túnel, por ejemplo `cloudflared tunnel --url http://localhost:3000` o `ngrok http 3000`.
3. Pon la URL pública (https) en `NEXT_PUBLIC_APP_URL` y reinicia la app. Con una URL https, las preferencias incluyen `notification_url` y `auto_return`.
4. En el panel de Mercado Pago registra `https://TU-TUNEL/api/webhooks/mercadopago` (ver `docs/PAYMENTS.md`) y copia la clave secreta a `MERCADOPAGO_WEBHOOK_SECRET`.
5. Paga con una cuenta de prueba y observa los logs del servidor. También puedes usar «Simular notificación» del panel (usa un id de pago real de prueba para que la consulta a la API encuentre el recurso).

## Antes de cerrar un cambio

- Typecheck y build sin errores.
- Si tocaste firma, idempotencia o transiciones de estado: prueba con notificaciones repetidas y con una firma alterada (debe responder 401).
- No afirmes que un pago o webhook funciona si no lo probaste con credenciales de prueba.
