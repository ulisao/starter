# GitHub Actions (CI)

## Propósito

Verifica automáticamente cada push a `main` y cada pull request: que el proyecto compile y que las pruebas pasen antes de integrar cambios.

## Arquitectura

`.github/workflows/ci.yml` ejecuta un solo job en Ubuntu con Node <%= nodeMajor %>, en este orden:

1. Checkout y preparación de `<%= packageManager %>`.
2. Instalación con lockfile congelado (`<%= ciInstallCmd %>`).
3. `typecheck`.
<%#if hasBiome%>
4. `lint` (Biome).
<%#endif%>
<%#if hasVitest%>
5. Pruebas unitarias (Vitest).
<%#endif%>
6. `build`.
<%#if hasPlaywright%>
7. Pruebas e2e con Playwright (instala Chromium) y publica el reporte como artefacto.
<%#endif%>

Si el proyecto usa Prisma, `prisma generate` se ejecuta en el `postinstall`; el build no necesita una base de datos.

## Configuración

- Versiona el lockfile (`<%= lockfile %>`); sin él la instalación congelada falla.
- Si el build exige variables al compilar (por ejemplo `NEXT_PUBLIC_*`), agrégalas al paso Build con `env:`. Las públicas pueden ir como texto; las secretas deben venir de *Settings → Secrets and variables → Actions* (`${{ secrets.NOMBRE }}`).
- Para exigir que la CI pase antes de fusionar, activa una regla de protección de rama en GitHub.

## Errores frecuentes

- **Lockfile desactualizado**: ejecuta `<%= installCmd %>` localmente y sube el lockfile.
- **Falla al compilar por variables faltantes**: define las variables del build en el workflow.
- **Versiones de las actions**: Dependabot puede mantenerlas al día (`.github/dependabot.yml` con el ecosistema `github-actions`).
