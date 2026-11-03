import { httpRouter } from "convex/server";
import { auth } from "./auth";

// Rutas HTTP de Convex. Convex Auth registra aquí los endpoints de verificación de tokens
// (/.well-known/jwks.json) y, si hay proveedores OAuth como Google, los de inicio y callback
// (/api/auth/signin/* y /api/auth/callback/*). Agrega tus propias rutas (webhooks) con `http.route`.
const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
