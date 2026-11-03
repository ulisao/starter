# Playwright (pruebas end-to-end)

## Propósito

Prueban la aplicación real en un navegador: lo que ve y hace una persona usuaria. Úsalas para flujos críticos (formularios, inicio de sesión, pagos); la lógica fina va en pruebas unitarias.

## Arquitectura

- `playwright.config.ts`: levanta la app con `<%= runCmd %> dev` (local) o `<%= runCmd %> start` (CI, requiere `build` previo) en `http://localhost:3000`, y reutiliza un servidor ya abierto en local.
- `tests/e2e/*.spec.ts`: las pruebas. `home.spec.ts` verifica el título, el formulario y la validación del servidor.
- Los reportes (`playwright-report/`, `test-results/`) están en `.gitignore`.

## Configuración

Descarga el navegador una sola vez (no se hace durante la instalación del proyecto):

```bash
<%= execCmd %> playwright install chromium
```

En Linux/CI agrega las dependencias del sistema: `<%= execCmd %> playwright install --with-deps chromium`.

## Comandos

- `<%= runCmd %> test:e2e` ejecuta las pruebas.
- `<%= execCmd %> playwright test --ui` abre el modo interactivo.
- `<%= execCmd %> playwright show-report` abre el último reporte HTML.

## Errores frecuentes

- **`Executable doesn't exist`**: falta ejecutar `playwright install`.
- **Puerto 3000 ocupado**: cierra el otro proceso o cambia `port` en `playwright.config.ts`.
- **Pruebas con base de datos o autenticación**: usa datos y usuarios de prueba; nunca credenciales reales.
