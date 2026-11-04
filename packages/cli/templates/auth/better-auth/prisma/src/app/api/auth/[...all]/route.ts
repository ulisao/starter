import { getAuth } from "@/lib/auth/auth";

// Punto de entrada HTTP de Better Auth: atiende /api/auth/* (inicio de sesión, callbacks
// de OAuth, cierre de sesión...). Equivale a `toNextJsHandler(auth)`, pero resuelve la
// instancia en cada petición para no leer variables de entorno al compilar.
const handler = (request: Request) => getAuth().handler(request);

export { handler as GET, handler as POST };
