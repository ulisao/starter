# Despliegue: Vercel y Docker

## Propósito

El proyecto está preparado para dos destinos. **No comparten configuración operativa**: cada uno recibe sus variables de entorno de forma distinta.

## Vercel

1. Importa el repositorio en Vercel (el framework Next.js se detecta solo; `vercel.json` lo declara explícitamente).
2. Carga las variables de `.env.example` en *Project Settings → Environment Variables*, con valores de **producción**. Detalle y origen de cada una en `docs/ENVIRONMENT.md`.
3. `NEXT_PUBLIC_APP_URL` debe ser tu dominio real de producción.
<%#if hasPrisma%>
4. Migraciones: Vercel no las ejecuta. Aplícalas desde tu equipo o CI con `<%= runCmd %> db:deploy` apuntando a la base de producción, antes de desplegar.
<%#if hasSupabase%>
5. Supabase: `DATABASE_URL` debe usar el pooler (puerto 6543); `DIRECT_URL` solo se usa para migraciones.
<%#endif%>
<%#endif%>
<%#if hasConvex%>
4. Convex: despliega las funciones con `<%= execCmd %> convex deploy` y configura `NEXT_PUBLIC_CONVEX_URL` con la URL del deployment de **producción**.
<%#endif%>

## Docker

```bash
docker build -t <%= name %> .
docker run --rm -p 3000:3000 --env-file .env.local <%= name %>
```

Con Docker Compose:

```bash
docker compose up --build
```

### Detalles importantes

- **Variables `NEXT_PUBLIC_*`**: se incrustan en el JavaScript durante el *build*. Pásalas como `--build-arg` (o en `build.args` de Compose); definirlas solo al ejecutar el contenedor no tiene efecto en el navegador.
- **Variables secretas**: se inyectan al ejecutar (`--env-file` o el orquestador), nunca en el build.
- **Imagen**: Node 22 Alpine, multi-stage, `output: "standalone"` (se activa con `BARETTA_STANDALONE=1` dentro del Dockerfile) y usuario no root.
<%#if hasPostgres%>
- **Base de datos**: Compose levanta PostgreSQL 17 para desarrollo. En producción usa una base administrada y apunta `DATABASE_URL` a ella.
- **Migraciones**: `docker compose --profile tools run --rm migrate`.
<%#endif%>
<%#if hasSupabase%>
- **Base de datos**: no se levanta ningún PostgreSQL local; el backend es Supabase.
<%#endif%>
<%#if hasConvex%>
- **Base de datos**: no se levanta ninguna base; el backend es Convex.
<%#endif%>

## Errores frecuentes

- *La pantalla carga pero falla el login/pagos en Docker*: faltó pasar alguna variable `NEXT_PUBLIC_*` como argumento de build.
- *Build de Docker sin lockfile*: ejecuta `<%= installCmd %>` localmente para generar `<%= lockfile %>` y súbelo.
