# syntax=docker/dockerfile:1

# Imagen de producción de <%= name %> (multi-stage, usuario no root).
#
# Build:   docker build -t <%= name %> .
# Ejecuta: docker run --rm -p 3000:3000 --env-file .env.local <%= name %>
#
# Node 22 LTS: cumple el rango "<%= nodeRange %>" del perfil de compatibilidad.
FROM node:22-alpine AS base
# libc6-compat evita fallos de binarios nativos en Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app
<%#if pmPnpm%>
RUN corepack enable pnpm
<%#endif%>
<%#if pmYarn%>
RUN corepack enable yarn
<%#endif%>
<%#if pmBun%>
RUN npm install -g bun
<%#endif%>

# ── Etapa 1: dependencias ────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json <%= lockfile %>* ./
<%#if hasPrisma%>
# `postinstall` ejecuta `prisma generate`, así que el esquema debe estar antes de instalar.
COPY prisma ./prisma
COPY prisma.config.ts ./
<%#endif%>
RUN <%= ciInstallCmd %>

# ── Etapa 2: build ───────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las variables NEXT_PUBLIC_* se incrustan en el JavaScript del navegador DURANTE el
# build, por eso deben llegar como argumentos de build (no solo al ejecutar el contenedor).
# Las variables secretas NO se pasan aquí: se inyectan al ejecutar (--env-file / orquestador).
<%= dockerBuildArgs %>
ENV BARETTA_STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN <%= runCmd %> build

# ── Etapa 3: ejecución ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario sin privilegios: si alguien explota la aplicación, no obtiene root en el contenedor.
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
