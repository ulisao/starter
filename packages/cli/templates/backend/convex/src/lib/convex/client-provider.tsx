"use client";

import type { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
<%#if isConvexAuth%>
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
<%#else%>
import { ConvexProvider } from "convex/react";
<%#endif%>

// Cliente de Convex para el navegador: habilita `useQuery`, `useMutation` y las suscripciones en
// tiempo real dentro de los Client Components. Se crea UNA sola vez por carga de página.
//
// NEXT_PUBLIC_CONVEX_URL la escribe `npx convex dev` en .env.local. Es pública (viaja al navegador)
// y Next.js la incrusta al compilar, así que debe existir también en `next build` y en Docker.
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  throw new Error("Falta NEXT_PUBLIC_CONVEX_URL. Ejecuta `npx convex dev` o revisa .env.example y docs/DATABASE.md.");
}
const convex = new ConvexReactClient(url);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
<%#if isConvexAuth%>
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
<%#else%>
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
<%#endif%>
}
