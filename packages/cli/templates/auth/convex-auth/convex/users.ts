import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/**
 * Usuario autenticado, o null si no hay sesión. Es el patrón de AUTORIZACIÓN en Convex:
 * `getAuthUserId(ctx)` lee la identidad del token de sesión (no de un argumento que mande el
 * cliente) y devuelve null si no hay sesión. Haz esta comprobación dentro de CADA query,
 * mutation o action que dependa del usuario; ocultar la ruta en Next.js no protege los datos.
 *
 * La usa `src/lib/auth/session.ts` desde el servidor de Next.js y puedes llamarla desde un
 * Client Component con `useQuery(api.users.viewer)`.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user === null) return null;
    return { id: user._id, email: user.email ?? null, name: user.name ?? null };
  },
});
