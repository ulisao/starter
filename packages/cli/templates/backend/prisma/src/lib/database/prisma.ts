import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireEnv } from "@/lib/env";

// Cliente único de Prisma. NO instancies PrismaClient en ningún otro archivo.
//
// POR QUÉ UN SINGLETON EN globalThis:
// en desarrollo, Next.js recarga módulos en caliente; sin esto cada recarga abriría
// conexiones nuevas hasta agotar el límite de la base de datos.
//
// POR QUÉ UNA FUNCIÓN Y NO UNA CONSTANTE:
// la conexión se crea al primer uso, no al importar el módulo. Así `next build`
// no exige DATABASE_URL cuando no ejecuta consultas.
//
// POR QUÉ UN ADAPTADOR:
// Prisma 7 se conecta a PostgreSQL a través de un driver adapter (@prisma/adapter-pg).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
<%#if hasSupabase%>
    // SUPABASE: DATABASE_URL debe apuntar al pooler (puerto 6543, modo transaction).
    // Es lo correcto para serverless (Vercel) porque cada invocación abre una conexión corta.
<%#endif%>
    const adapter = new PrismaPg({ connectionString: requireEnv("DATABASE_URL") });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
