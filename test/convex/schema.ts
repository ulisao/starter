import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


// Esquema de datos de Convex. Convex valida cada documento contra este esquema al escribir
// y genera los tipos de `convex/_generated/dataModel.d.ts` a partir de él.
//
// Cómo cambiarlo: agrega tablas con `defineTable({...})` usando los validadores `v`. Los índices
// (`.index("nombre", ["campo"])`) son necesarios para consultar por campo de forma eficiente.
// Convex rechaza el despliegue si los datos existentes no cumplen el nuevo esquema: para campos
// nuevos usa `v.optional(...)` y migra los datos después. Más detalle en docs/DATABASE.md.
//
// Los módulos del starter (autenticación, pagos...) aportan sus tablas en las primeras líneas de
// `defineSchema`; no las elimines a mano, son necesarias para que esos módulos funcionen.
export default defineSchema({
  paymentTransactions: defineTable({
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
    .index("by_user", ["userId"]),
  // Mensajes del formulario de contacto (ver src/services/contact-service.ts).
  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
  }),
});
