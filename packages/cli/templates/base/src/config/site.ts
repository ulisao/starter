// Datos generales del sitio. Se usan en metadatos, header y footer.
// Cambia el nombre y la descripción por los de tu proyecto.
export const siteConfig = {
  name: "<%= name %>",
  description: "Proyecto creado con Baretta Starter.",
  // URL pública del sitio. En desarrollo es http://localhost:3000.
  // En producción debe coincidir con tu dominio real (se usa para URLs absolutas
  // y, si hay autenticación o pagos, para las redirecciones del proveedor).
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
