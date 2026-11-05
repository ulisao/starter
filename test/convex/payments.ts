import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Persistencia de las transacciones de pago en Convex (tabla `paymentTransactions`).
 *
 * Las funciones son PÚBLICAS (las llama el servidor de Next.js con `fetchQuery`/`fetchMutation`),
 * así que cada una exige el secreto compartido CONVEX_PAYMENTS_SECRET: sin él, cualquiera podría
 * marcar su propia transacción como aprobada. Defínelo con el mismo valor en `.env.local` y en el
 * deployment: `npx convex env set CONVEX_PAYMENTS_SECRET <valor-largo-aleatorio>`. Si tu app tiene
 * autenticación, puedes sustituir el secreto por una comprobación de `ctx.auth.getUserIdentity()`.
 *
 * La lógica de negocio (hablar con Mercado Pago, verificar montos, ejecutar hooks) vive en el
 * servidor de Next.js (`src/services/payments/`). Aquí solo se guarda y se lee el estado, con la
 * garantía de que cada mutation es una transacción serializable (idempotencia segura).
 */
const statusValidator = v.union(
  v.literal("PENDING"),
  v.literal("APPROVED"),
  v.literal("REJECTED"),
  v.literal("CANCELLED"),
  v.literal("REFUNDED"),
);

function assertSecret(secret: string) {
  const expected = process.env.CONVEX_PAYMENTS_SECRET;
  if (!expected || secret !== expected) throw new Error("No autorizado");
}

export const getById = query({
  args: { secret: v.string(), id: v.string() },
  handler: async (ctx, { secret, id }) => {
    assertSecret(secret);
    // `id` llega como texto (puede provenir de `external_reference`); normalizeId devuelve null
    // si no es un id válido de esta tabla, en vez de lanzar.
    const normalized = ctx.db.normalizeId("paymentTransactions", id);
    return normalized ? await ctx.db.get(normalized) : null;
  },
});

export const getByIdempotencyKey = query({
  args: { secret: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, { secret, idempotencyKey }) => {
    assertSecret(secret);
    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", idempotencyKey))
      .unique();
  },
});

export const getByMpPaymentId = query({
  args: { secret: v.string(), mpPaymentId: v.string() },
  handler: async (ctx, { secret, mpPaymentId }) => {
    assertSecret(secret);
    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_mpPaymentId", (q) => q.eq("mpPaymentId", mpPaymentId))
      .unique();
  },
});

/**
 * Crea una transacción PENDING, o devuelve la existente si ya hay una con la misma clave de
 * idempotencia. El chequeo-e-inserción es atómico (la mutation es una transacción), así que un
 * doble clic o un reintento de red no duplican el cobro aunque lleguen a la vez.
 */
export const createTransaction = mutation({
  args: {
    secret: v.string(),
    userId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    productId: v.string(),
    title: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, { secret, ...data }) => {
    assertSecret(secret);
    if (data.idempotencyKey) {
      const existing = await ctx.db
        .query("paymentTransactions")
        .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", data.idempotencyKey))
        .unique();
      if (existing) return existing._id;
    }
    return await ctx.db.insert("paymentTransactions", { ...data, status: "PENDING" });
  },
});

export const setPreference = mutation({
  args: { secret: v.string(), id: v.id("paymentTransactions"), preferenceId: v.string(), checkoutUrl: v.string() },
  handler: async (ctx, { secret, id, preferenceId, checkoutUrl }) => {
    assertSecret(secret);
    await ctx.db.patch(id, { preferenceId, checkoutUrl });
    return null;
  },
});

/**
 * Aplica un estado a la transacción solo si cambia (equivalente idempotente del `updateMany`
 * condicional de Prisma). Devuelve si la transición la dejó en APPROVED, para que el servidor
 * ejecute `onPaymentApproved` una única vez por aprobación.
 */
export const applyState = mutation({
  args: {
    secret: v.string(),
    id: v.id("paymentTransactions"),
    status: statusValidator,
    statusDetail: v.optional(v.string()),
    mpPaymentId: v.string(),
  },
  handler: async (ctx, { secret, id, status, statusDetail, mpPaymentId }) => {
    assertSecret(secret);
    const tx = await ctx.db.get(id);
    if (!tx || tx.status === status) return { changedToApproved: false };
    await ctx.db.patch(id, { status, statusDetail, mpPaymentId });
    return { changedToApproved: status === "APPROVED" };
  },
});

/**
 * Registra el cobro periódico de una suscripción como una transacción PENDING (su estado real lo
 * aplica después `applyState`, que dispara el hook), o devuelve la existente si ese pago ya se
 * registró (clave `mpPaymentId`). Atómico: una notificación repetida no crea dos filas.
 */
export const createRenewalTransaction = mutation({
  args: {
    secret: v.string(),
    userId: v.optional(v.string()),
    productId: v.string(),
    title: v.string(),
    amount: v.number(),
    currency: v.string(),
    mpPaymentId: v.string(),
    mpPreapprovalId: v.string(),
  },
  handler: async (ctx, { secret, ...data }) => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_mpPaymentId", (q) => q.eq("mpPaymentId", data.mpPaymentId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("paymentTransactions", { ...data, status: "PENDING" });
  },
});
