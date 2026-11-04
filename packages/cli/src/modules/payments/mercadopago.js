// Módulo de pagos con Mercado Pago. Se compone de piezas que se combinan según el backend, igual
// que Better Auth: una capa COMÚN agnóstica del backend (cliente del SDK, webhook firmado, catálogo,
// hooks, UI y rutas) más una capa de PERSISTENCIA que cambia entre Prisma (PostgreSQL/Supabase) y
// Convex. Los servicios (`transactions.ts`, `checkout-service.ts`, `subscriptions.ts`) exponen el
// mismo contrato en ambas persistencias, así que la capa común no sabe dónde se guardan los datos.
//
//   payments-mercadopago              común: cliente, webhook, catálogo, hooks, docs.
//   payments-mercadopago-prisma       persistencia en Prisma (schema + transactions.ts).
//   payments-mercadopago-convex       persistencia en Convex (convex/payments.ts + transactions.ts).
//   payments-mercadopago-one-time*    checkout de pago único (común + persistencia).
//   payments-mercadopago-subscription* suscripciones (común + persistencia).

const mpEnabled = (cfg) => !!cfg.payments?.enabled && cfg.payments.provider === 'mercadopago';
const mpPrisma = (cfg) => mpEnabled(cfg) && cfg.backend !== 'convex';
const mpConvex = (cfg) => mpEnabled(cfg) && cfg.backend === 'convex';
const isOneTime = (cfg) => cfg.payments?.type === 'one-time';
const isSubscription = (cfg) => cfg.payments?.type === 'subscription';

// Las funciones de convex/payments.ts leen este secreto desde el DEPLOYMENT de Convex (process.env),
// y el servidor de Next.js lo lee desde .env.local: debe tener el mismo valor en ambos lados.
const convexSecretEnv = {
  key: 'CONVEX_PAYMENTS_SECRET',
  description:
    'Secreto compartido que protege las funciones de pagos de Convex (convex/payments.ts). Úsalo con el MISMO valor en .env.local y en el deployment de Convex (npx convex env set).',
  secret: true,
  example: '',
  where: 'Valor largo aleatorio (p. ej. `openssl rand -hex 32`); en Convex: `npx convex env set CONVEX_PAYMENTS_SECRET <valor>`.',
};

// Tabla de transacciones para el schema de Convex (slot convexSchemaTables de backend-convex).
const transactionsTable = `  paymentTransactions: defineTable({
    userId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    productId: v.string(),
    title: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("PENDING"), v.literal("APPROVED"), v.literal("REJECTED"), v.literal("CANCELLED"), v.literal("REFUNDED")),
    statusDetail: v.optional(v.string()),
    preferenceId: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    mpPaymentId: v.optional(v.string()),
    mpPreapprovalId: v.optional(v.string()),
  })
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_mpPaymentId", ["mpPaymentId"])
    .index("by_mpPreapprovalId", ["mpPreapprovalId"])
    .index("by_user", ["userId"]),`;

const subscriptionsTable = `  paymentSubscriptions: defineTable({
    userId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    planId: v.string(),
    payerEmail: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("PENDING"), v.literal("AUTHORIZED"), v.literal("PAUSED"), v.literal("CANCELLED")),
    checkoutUrl: v.optional(v.string()),
    mpPreapprovalId: v.optional(v.string()),
    nextPaymentDate: v.optional(v.number()),
  })
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_mpPreapprovalId", ["mpPreapprovalId"])
    .index("by_user", ["userId"]),`;

export default [
  // ── Capa común (agnóstica del backend) ──────────────────────────────────────
  {
    id: 'payments-mercadopago',
    when: mpEnabled,
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
    stack: ['Mercado Pago (SDK oficial `mercadopago`) con webhook de firma verificada'],
    notes: [
      'Pagos: lee `src/features/payments/AGENTS.md` y `docs/PAYMENTS.md` antes de tocar cualquier archivo de `src/services/payments/` o del webhook. Un pago solo se aprueba tras consultar su estado a la API de Mercado Pago desde el webhook.',
      'Pagos: precios y productos/planes se definen SOLO en el servidor (`src/services/payments/catalog.ts`); el cliente envía un identificador, nunca un monto. Las reglas de negocio al aprobar un pago van en `src/services/payments/hooks.ts`.',
    ],
  },
  // ── Persistencia común ──────────────────────────────────────────────────────
  {
    id: 'payments-mercadopago-prisma',
    when: mpPrisma,
    templates: 'payments/mercadopago/prisma',
    stack: ['Pagos: registro de transacciones en Prisma (`payment_transactions`)'],
    notes: ['Pagos: los modelos están en `prisma/schema/payments.prisma`; tras clonar ejecuta `db:migrate`. `userId` es opcional y sin clave foránea (el proveedor de auth puede ser externo).'],
  },
  {
    id: 'payments-mercadopago-convex',
    when: mpConvex,
    templates: 'payments/mercadopago/convex',
    dependencies: ['convex'],
    env: [convexSecretEnv],
    slots: {
      convexSchemaTables: transactionsTable,
      convexApiImports: 'import type * as payments from "../payments.js";',
      convexApiModules: '  payments: typeof payments;',
    },
    stack: ['Pagos: registro de transacciones en Convex (`paymentTransactions`, funciones en `convex/payments.ts`)'],
    notes: [
      'Pagos (Convex): las transacciones viven en la tabla `paymentTransactions` y las funciones de `convex/payments.ts` las protege el secreto `CONVEX_PAYMENTS_SECRET` (mismo valor en .env.local y en el deployment). Cada mutation es una transacción serializable, así que la idempotencia (crear/aprobar) es segura.',
    ],
  },
  // ── Pago único ──────────────────────────────────────────────────────────────
  {
    id: 'payments-mercadopago-one-time',
    when: (cfg) => mpEnabled(cfg) && isOneTime(cfg),
    templates: 'payments/mercadopago/one-time',
  },
  {
    id: 'payments-mercadopago-one-time-prisma',
    when: (cfg) => mpPrisma(cfg) && isOneTime(cfg),
    templates: 'payments/mercadopago/one-time-prisma',
  },
  {
    id: 'payments-mercadopago-one-time-convex',
    when: (cfg) => mpConvex(cfg) && isOneTime(cfg),
    templates: 'payments/mercadopago/one-time-convex',
  },
  // ── Suscripciones ───────────────────────────────────────────────────────────
  {
    id: 'payments-mercadopago-subscription',
    when: (cfg) => mpEnabled(cfg) && isSubscription(cfg),
    templates: 'payments/mercadopago/subscription',
  },
  {
    id: 'payments-mercadopago-subscription-prisma',
    when: (cfg) => mpPrisma(cfg) && isSubscription(cfg),
    templates: 'payments/mercadopago/subscription-prisma',
  },
  {
    id: 'payments-mercadopago-subscription-convex',
    when: (cfg) => mpConvex(cfg) && isSubscription(cfg),
    templates: 'payments/mercadopago/subscription-convex',
    slots: {
      convexSchemaTables: subscriptionsTable,
      convexApiImports: 'import type * as paymentsSubscriptions from "../paymentsSubscriptions.js";',
      convexApiModules: '  paymentsSubscriptions: typeof paymentsSubscriptions;',
    },
  },
];
