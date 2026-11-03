# Arquitectura

## Propósito

Explica cómo está organizado el proyecto y dónde debe vivir cada responsabilidad, para que personas y agentes agreguen código en el lugar correcto.

## Capas

```text
src/
├── app/          Rutas de Next.js (App Router). Delgadas.
├── features/     Un directorio por dominio de negocio.
├── services/     Lógica de negocio reutilizable (sin HTTP ni React).
├── lib/          Integraciones con sistemas externos.
├── components/   UI compartida (ui/, layout/, shared/).
├── config/       Configuración estática del sitio.
└── styles/       CSS global y tokens de diseño.
```

Dirección de dependencias: `app → features → services → lib`. Una capa interior nunca importa de una exterior (por ejemplo, un servicio no importa de `app/`).

## Organización por features

```text
src/features/orders/
├── components/   UI específica de la feature
├── schemas/      esquemas Zod
├── actions.ts    Server Actions
├── hooks/        hooks de cliente
├── types/        tipos propios
└── index.ts      API pública (lo único que importan los demás)
```

No todas las features necesitan todas las carpetas: crea solo las que uses. La feature `contact` es un ejemplo completo y pequeño.

## Server Components y Client Components

- Por defecto todo es Server Component.
- `"use client"` solo para estado, efectos o APIs del navegador, y lo más abajo posible en el árbol.
- Los secretos y las integraciones (`src/lib`) nunca se importan desde un Client Component.

## Rutas

- `src/app/(public)/` — páginas públicas (el grupo no altera la URL).
- `src/app/api/` — Route Handlers (se crea cuando se necesita el primero).
<%#if hasAuth%>
- `src/app/(dashboard)/` — páginas que requieren sesión.
<%#endif%>

## Diseño visual

Los tokens (colores, tipografía, radio) están en `src/styles/globals.css`. Para aplicar una referencia visual cambia solo los tokens y los componentes de `src/components/`.

## Stack de este proyecto

<%= stackList %>

Decisiones registradas en `docs/decisions/`.
