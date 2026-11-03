import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
<%= slot_convexSchemaImports %>

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
<%= slot_convexSchemaTables %>
  // Mensajes del formulario de contacto (ver src/services/contact-service.ts).
  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
  }),
});
