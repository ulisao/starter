import { query } from "./_generated/server";

// Ejemplo mínimo de función de Convex que conoce al usuario: devuelve la identidad que Clerk
// firmó en el token de sesión (o null sin sesión). La identidad la verifica Convex; nunca sale de
// un argumento que mande el cliente. Copia este patrón en cada query/mutation que dependa del usuario:
//
//   const identity = await ctx.auth.getUserIdentity();
//   if (!identity) throw new Error("No autenticado");
//   // identity.subject es el id del usuario en Clerk (el mismo que devuelve getSessionUserId()).
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return { id: identity.subject, email: identity.email ?? null, name: identity.name ?? null };
  },
});
