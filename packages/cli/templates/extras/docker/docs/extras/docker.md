# Docker (desarrollo local)

## Propósito

Entorno local reproducible sin instalar servicios en tu máquina. Es independiente de la imagen de producción: el `Dockerfile` y el `docker-compose.yml` de la raíz (ver `docs/DEPLOYMENT.md`) siguen siendo los de despliegue.

## Arquitectura

`docker-compose.dev.yml`:
<%#if hasPostgres%>
- `db`: PostgreSQL 17 con volumen `pgdata` (los datos sobreviven a `docker:down`) y healthcheck. La aplicación corre fuera de Docker con `<%= runCmd %> dev` y usa `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/<%= name %>`. Comparte nombre de servicio y volumen con el compose de producción: no ejecutes ambos a la vez (puerto 5432).
<%#else%>
- `app`: Node 22 con tu código montado como volumen; instala dependencias y ejecuta `<%= runCmd %> dev`. `node_modules` usa un volumen propio.
<%#endif%>

## Comandos

- `<%= runCmd %> docker:dev` levanta el entorno.
- `<%= runCmd %> docker:down` lo detiene. Para borrar también los datos: `docker compose -f docker-compose.dev.yml down -v`.

## Errores frecuentes

- **Puerto ocupado**: cambia el mapeo `ports` en `docker-compose.dev.yml` (y la URL correspondiente).
- **`docker: command not found`**: instala Docker Desktop o Docker Engine con el plugin Compose.
- **Cambié las credenciales y no se aplican**: PostgreSQL solo las lee al crear el volumen; ejecuta `down -v` para recrearlo (borra los datos).
