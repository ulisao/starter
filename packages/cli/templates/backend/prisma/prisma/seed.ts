import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Datos iniciales de desarrollo. Se ejecuta con `<%= runCmd %> db:seed`.
//
// Este script corre FUERA de Next.js, por eso crea su propio cliente en lugar de
// importar src/lib/database/prisma.ts (que usa "server-only" y solo funciona dentro de Next).
// Debe ser idempotente: poder ejecutarse varias veces sin duplicar datos (usa upsert).
config({ path: [".env.local", ".env"], quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL. Revisa .env.example y docs/ENVIRONMENT.md.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Ejemplo: agrega aquí tus upserts. Por ahora solo verifica la conexión.
  const total = await prisma.contactMessage.count();
  console.info(`Seed OK. Mensajes de contacto existentes: ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
