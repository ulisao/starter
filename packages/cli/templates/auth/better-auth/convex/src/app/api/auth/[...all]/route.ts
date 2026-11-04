import { getAuthServer } from "@/lib/auth/server";

// Punto de entrada HTTP de Better Auth: Next.js reenvía /api/auth/* al deployment de Convex
// (dominio `.convex.site`), donde corre la lógica real. Se resuelve en cada petición para no leer
// variables de entorno al compilar.
export const GET = (request: Request) => getAuthServer().handler.GET(request);
export const POST = (request: Request) => getAuthServer().handler.POST(request);
