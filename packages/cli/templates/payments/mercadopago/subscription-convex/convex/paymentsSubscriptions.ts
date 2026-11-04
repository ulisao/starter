import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Persistencia de las suscripciones de pago en Convex (tabla `paymentSubscriptions`).
 *
 * Igual que `convex/payments.ts`: funciones públicas que el servidor de Next.js invoca y que
 * exigen el secreto compartido CONVEX_PAYMENTS_SECRET. La lógica de negocio (Mercado Pago,
 * verificación de montos, hooks) vive en `src/services/payments/subscriptions.ts`.
 */
const statusValidator = v.union(
  v.literal("PENDING"),
  v.literal("AUTHORIZED"),
  v.literal("PAUSED"),
  v.literal("CANCELLED"),
);

function assertSecret(secret: string) {
  const expected = process.env.CONVEX_PAYMENTS_SECRET;
  if (!expected || secret !== expected) throw new Error("No autorizado");
}

export const getById = query({
  args: { secret: v.string(), id: v.string() },
  handler: async (ctx, { secret, id }) => {
    assertSecret(secret);
    const normalized = ctx.db.normalizeId("paymentSubscriptions", id);
    return normalized ? await ctx.db.get(normalized) : null;
  },
});

export const getByIdempotencyKey = query({
  args: { secret: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, { secret, idempotencyKey }) => {
    assertSecret(secret);
    return await ctx.db
      .query("paymentSubscriptions")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", idempotencyKey))
      .unique();
  },
});

export const getByMpPreapprovalId = query({
  args: { secret: v.string(), mpPreapprovalId: v.string() },
  handler: async (ctx, { secret, mpPreapprovalId }) => {
    assertSecret(secret);
    return await ctx.db
      .query("paymentSubscriptions")
      .withIndex("by_mpPreapprovalId", (q) => q.eq("mpPreapprovalId", mpPreapprovalId))
      .unique();
  },
});

/** Crea una suscripción PENDING, o devuelve la existente con la misma clave de idempotencia (atómico). */
export const createSubscription = mutation({
  args: {
    secret: v.string(),
    userId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    planId: v.string(),
    payerEmail: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, { secret, ...data }) => {
    assertSecret(secret);
    if (data.idempotencyKey) {
      const existing = await ctx.db
        .query("paymentSubscriptions")
        .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", data.idempotencyKey))
        .unique();
      if (existing) return existing._id;
    }
    return await ctx.db.insert("paymentSubscriptions", { ...data, status: "PENDING" });
  },
});

export const setPreapproval = mutation({
  args: { secret: v.string(), id: v.id("paymentSubscriptions"), mpPreapprovalId: v.string(), checkoutUrl: v.string() },
  handler: async (ctx, { secret, id, mpPreapprovalId, checkoutUrl }) => {
    assertSecret(secret);
    await ctx.db.patch(id, { mpPreapprovalId, checkoutUrl });
    return null;
  },
});

/**
 * Aplica un estado a la suscripción solo si cambia. Devuelve si hubo cambio, para que el servidor
 * ejecute `onSubscriptionChanged` una sola vez por transición.
 */
export const applyState = mutation({
  args: {
    secret: v.string(),
    id: v.id("paymentSubscriptions"),
    status: statusValidator,
    mpPreapprovalId: v.optional(v.string()),
    nextPaymentDate: v.optional(v.number()),
  },
  handler: async (ctx, { secret, id, status, mpPreapprovalId, nextPaymentDate }) => {
    assertSecret(secret);
    const sub = await ctx.db.get(id);
    if (!sub || sub.status === status) return { changed: false };
    await ctx.db.patch(id, { status, mpPreapprovalId: mpPreapprovalId ?? sub.mpPreapprovalId, nextPaymentDate });
    return { changed: true };
  },
});
