import { ConvexError, v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";

// Funciones de ejemplo del formulario de contacto. Sirven de patrón para las tuyas:
//   - `query` / `mutation` / `action` son PÚBLICAS: cualquiera con la URL del deployment puede
//     invocarlas desde su navegador, saltándose tus Server Actions. Por eso validan y autorizan aquí.
//   - `internalQuery` / `internalMutation` / `internalAction` solo se llaman desde otras funciones
//     de Convex, desde el Dashboard o con `npx convex run`; nunca desde el cliente.

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Guarda un mensaje de contacto. Es pública a propósito (el formulario es público), así que
 * repite la validación del servidor de Next.js: los validadores `v` solo comprueban el tipo.
 * Para limitar el spam agrega un límite de frecuencia, por ejemplo con el componente oficial
 * `@convex-dev/rate-limiter`.
 */
export const create = mutation({
  args: { name: v.string(), email: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const message = args.message.trim();
    if (name.length < 2 || name.length > 100) throw new ConvexError("Nombre inválido.");
    if (args.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) throw new ConvexError("Email inválido.");
    if (message.length < 10 || message.length > MAX_MESSAGE_LENGTH) throw new ConvexError("Mensaje inválido.");
    return await ctx.db.insert("contactMessages", { name, email: args.email, message });
  },
});

/**
 * Últimos mensajes recibidos. Es `internal`, así que NO la puede llamar el navegador: ejecútala
 * desde el Dashboard de Convex (Functions → Run function) o con `npx convex run contactMessages:recent`.
 * Si quieres mostrarlos en tu aplicación, expón una `query` pública que compruebe el rol del usuario.
 */
export const recent = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contactMessages").order("desc").take(50);
  },
});
