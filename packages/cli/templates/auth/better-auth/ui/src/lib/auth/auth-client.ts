import { createAuthClient } from "better-auth/react";
<%#if authMagicLink%>
import { magicLinkClient } from "better-auth/client/plugins";
<%#endif%>
<%#if authOtp%>
import { emailOTPClient } from "better-auth/client/plugins";
<%#endif%>
<%#if hasConvex%>
import { convexClient } from "@convex-dev/better-auth/client/plugins";
<%#endif%>

// Cliente de Better Auth para componentes de navegador ("use client").
// No necesita baseURL: usa el mismo origen que la página, donde vive /api/auth.
// Los plugins del cliente deben coincidir con los del servidor de Better Auth.
// Nunca importes este archivo desde código de servidor: para eso usa src/lib/auth/session.ts.
export const authClient = createAuthClient({
  plugins: [
<%#if hasConvex%>
    convexClient(),
<%#endif%>
<%#if authMagicLink%>
    magicLinkClient(),
<%#endif%>
<%#if authOtp%>
    emailOTPClient(),
<%#endif%>
  ],
});
