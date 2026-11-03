# <%= name %>

Proyecto Next.js generado con **Baretta Starter** (Estudio Baretta).

## Stack

<%= stackList %>

## Empezar

```bash
<%= installCmd %>
cp .env.example .env.local   # completa los valores: ver docs/ENVIRONMENT.md
<%= runCmd %> dev
```

Node.js requerido: `<%= nodeRange %>`. La aplicación queda en http://localhost:3000.

## Scripts

<%= scriptsList %>

## Documentación

Toda la documentación técnica está en `docs/`:

| Documento | Contenido |
| --- | --- |
| `docs/ARCHITECTURE.md` | Estructura y convenciones |
| `docs/ENVIRONMENT.md` | Variables de entorno |
| `docs/API.md` | Rutas y Server Actions |
| `docs/SECURITY.md` | Reglas de seguridad |
| `docs/TESTING.md` | Estrategia de tests |
| `docs/DEPLOYMENT.md` | Vercel y Docker |
| `docs/COMPATIBILITY.md` | Versiones fijadas y estado de verificación |
| `docs/EXTRAS.md` | Extras instalados |
<%#if hasPrisma%>
| `docs/DATABASE.md` | Prisma, migraciones y seed |
<%#else%>
| `docs/DATABASE.md` | Convex: esquema y funciones |
<%#endif%>
<%#if hasAuth%>
| `docs/AUTHENTICATION.md` | Configuración de <%= authLabel %> |
<%#endif%>
<%#if hasPayments%>
| `docs/PAYMENTS.md` | Mercado Pago |
<%#endif%>

## Trabajar con agentes de IA

`AGENTS.md` y `CLAUDE.md` contienen las reglas que cualquier agente debe seguir. `baretta.config.json` registra las decisiones con las que se generó el proyecto.
