import betterAuth from "@convex-dev/better-auth/convex.config";
import { defineApp } from "convex/server";

// Instala el componente de Better Auth dentro del deployment de Convex: sus tablas (usuarios,
// sesiones, cuentas, claves JWT) viven en el componente, aisladas de tu `schema.ts`.
const app = defineApp();
app.use(betterAuth);

export default app;
