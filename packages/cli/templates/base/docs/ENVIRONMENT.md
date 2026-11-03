# Variables de entorno

## Propósito

Lista todas las variables que usa el proyecto, cuáles son secretas y de dónde obtenerlas. La fuente de verdad es `.env.example`.

## Uso

```bash
cp .env.example .env.local
```

`.env.local` está en `.gitignore`: **nunca lo subas al repositorio**.

## Reglas

- Las variables con prefijo `NEXT_PUBLIC_` se incluyen en el JavaScript del navegador: nunca pongas secretos ahí.
- Las secretas se leen solo en servidor con `requireEnv("NOMBRE")` (`src/lib/env.ts`).
- Vercel y Docker no comparten configuración operativa: en Vercel se cargan en *Project Settings → Environment Variables*; en Docker mediante `env_file` o variables del orquestador (ver `docs/DEPLOYMENT.md`).

## Variables

<%= envTable %>

## Errores frecuentes

- *"Falta la variable de entorno X"*: no está definida en `.env.local` (desarrollo) o en el panel del hosting (producción).
- Cambiaste `.env.local` y no se nota: reinicia `<%= runCmd %> dev`.
