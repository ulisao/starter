import type { ReactNode } from "react";
<%= providersImports %>

// Punto único donde se montan los proveedores de contexto de la aplicación
// (autenticación, cliente de backend, analytics...).
//
// Este archivo lo GENERA Baretta Starter a partir de los módulos que elegiste: cada uno
// declara su proveedor y se anidan en un orden seguro. Si necesitas agregar uno propio,
// envuélvelo aquí. Sigue siendo un Server Component: los proveedores que usan estado
// del navegador son Client Components propios (con "use client") importados arriba.
export function Providers({ children }: { children: ReactNode }) {
  return (
<%= providersOpen %>
<%= providersChildren %>
<%= providersClose %>
  );
}
