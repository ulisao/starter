import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Funciones de archivos usadas por el servidor de Next.js (src/lib/storage).
 *
 * Las funciones públicas de Convex pueden invocarse desde cualquier cliente, así
 * que cada una exige el secreto CONVEX_STORAGE_SECRET. Defínelo en Convex con:
 *   npx convex env set CONVEX_STORAGE_SECRET <valor-largo-aleatorio>
 * y usa el mismo valor en .env.local. Si tu app tiene autenticación, puedes
 * reemplazar este secreto por una comprobación de `ctx.auth.getUserIdentity()`.
 */
function assertSecret(secret: string) {
  const expected = process.env.CONVEX_STORAGE_SECRET;
  if (!expected || secret !== expected) throw new Error("No autorizado");
}

export const generateUploadUrl = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    assertSecret(secret);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = mutation({
  args: { secret: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { secret, storageId }) => {
    assertSecret(secret);
    return await ctx.storage.getUrl(storageId);
  },
});

export const remove = mutation({
  args: { secret: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { secret, storageId }) => {
    assertSecret(secret);
    await ctx.storage.delete(storageId);
    return null;
  },
});
