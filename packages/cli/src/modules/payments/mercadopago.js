// Módulo de pagos con Mercado Pago para backends con Prisma (PostgreSQL propio y Supabase).
// La persistencia sobre Convex la aporta otro módulo.
//
// Se compone de tres módulos que comparten el mismo prefijo de plantillas:
//   - payments-mercadopago            → base común: cliente, webhook firmado, transacciones, docs.
//   - payments-mercadopago-one-time   → preferencias de Checkout Pro (pago único).
//   - payments-mercadopago-subscription → suscripciones con la API de preapproval.

const prismaPayments = (cfg) => !!cfg.payments?.enabled && cfg.payments.provider === 'mercadopago' && cfg.backend !== 'convex';

export default [
  {
    id: 'payments-mercadopago',
    when: prismaPayments,
    templates: 'payments/mercadopago/common',
    dependencies: ['mercadopago'],
    env: [
      {
        key: 'MERCADOPAGO_ACCESS_TOKEN',
        description: 'Access token privado de Mercado Pago. Con credenciales de prueba (TEST-...) todo ocurre en sandbox.',
        secret: true,
        example: 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000',
        where: 'Mercado Pago → Tus integraciones → tu aplicación → Credenciales de prueba (desarrollo) o de producción.',
      },
      {
        key: 'MERCADOPAGO_WEBHOOK_SECRET',
        description: 'Clave secreta con la que Mercado Pago firma las notificaciones (cabecera x-signature).',
        secret: true,
        example: '',
        where: 'Mercado Pago → Tus integraciones → tu aplicación → Webhooks → Configurar notificaciones → Clave secreta.',
      },
    ],
    stack: ['Mercado Pago (SDK oficial `mercadopago`) con registro de transacciones en Prisma y webhook con firma verificada'],
    notes: [
      'Pagos: lee `src/features/payments/AGENTS.md` y `docs/PAYMENTS.md` antes de tocar cualquier archivo de `src/services/payments/` o del webhook. Un pago solo se aprueba tras consultar su estado a la API de Mercado Pago desde el webhook.',
      'Pagos: precios y productos/planes se definen SOLO en el servidor (`src/services/payments/catalog.ts`); el cliente envía un identificador, nunca un monto. Las reglas de negocio al aprobar un pago van en `src/services/payments/hooks.ts`.',
    ],
  },
  {
    id: 'payments-mercadopago-one-time',
    when: (cfg) => prismaPayments(cfg) && cfg.payments.type === 'one-time',
    templates: 'payments/mercadopago/one-time',
  },
  {
    id: 'payments-mercadopago-subscription',
    when: (cfg) => prismaPayments(cfg) && cfg.payments.type === 'subscription',
    templates: 'payments/mercadopago/subscription',
  },
];
