import type { NextConfig } from "next";

// Configuración de Next.js.
//
// `output: "standalone"` genera un servidor mínimo para la imagen Docker (ver Dockerfile).
// Solo se activa cuando el Dockerfile define BARETTA_STANDALONE=1, así que no
// afecta al despliegue en Vercel ni al desarrollo local.
const nextConfig: NextConfig = {
  output: process.env.BARETTA_STANDALONE === "1" ? "standalone" : undefined,
  reactStrictMode: true,
};

export default nextConfig;
