import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Configuración de la CLI de Prisma 7 (migraciones, generate, studio, seed).
//
// Prisma 7 ya NO carga archivos .env automáticamente, por eso se cargan aquí.
// Se lee primero .env.local (convención de Next.js) y después .env. En producción
// (Vercel, Docker) las variables vienen del entorno y estos archivos no existen.
config({ path: [".env.local", ".env"], quiet: true });

<%#if hasSupabase%>
// SUPABASE: las migraciones necesitan la conexión DIRECTA (puerto 5432).
// El pooler (puerto 6543, DATABASE_URL) no soporta las operaciones de migración.
// Durante `prisma generate` no se usa la base, por eso el valor por defecto vacío.
const migrationUrl = process.env.DIRECT_URL ?? "";
<%#else%>
// Durante `prisma generate` no se conecta a la base, por eso el valor por defecto vacío:
// así `npm install` (postinstall) funciona aunque todavía no exista .env.local.
const migrationUrl = process.env.DATABASE_URL ?? "";
<%#endif%>

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    // Comando que ejecuta `<%= runCmd %> db:seed`.
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url: migrationUrl },
});
