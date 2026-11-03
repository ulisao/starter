"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Último recurso de errores de React: se muestra cuando falla el layout raíz.
 * Reemplaza al layout, por eso define su propio <html> y <body> (sin Tailwind ni
 * proveedores). Reporta el error a Sentry y ofrece reintentar.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>Algo salió mal</h1>
        <p>Ocurrió un error inesperado. Ya fue reportado.</p>
        <button type="button" onClick={reset}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
