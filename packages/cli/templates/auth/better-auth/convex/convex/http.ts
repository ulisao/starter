import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

// Registra las rutas HTTP de Better Auth (/api/auth/*) en el dominio `.convex.site` del deployment.
// Next.js las reenvía desde src/app/api/auth/[...all]/route.ts.
const http = httpRouter();
authComponent.registerRoutes(http, createAuth);

export default http;
