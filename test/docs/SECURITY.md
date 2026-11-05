# Seguridad

## Propósito

Reglas de seguridad que todo cambio debe respetar. Si una regla no se cumple, es un bug.

## Reglas

1. **Validación de entrada**: todo dato externo se valida con Zod en el servidor.
2. **Autorización en el servidor**: la UI puede ocultar botones, pero cada operación sensible comprueba identidad y permisos del lado servidor.
3. **Secretos**: solo en variables de entorno del servidor, nunca con prefijo `NEXT_PUBLIC_`, nunca en el repositorio ni en logs.
4. **Separación servidor/cliente**: `src/lib/env.ts` usa `server-only`; si un Client Component lo importa, el build falla a propósito.
5. **Errores**: el cliente recibe mensajes genéricos; el detalle queda en los logs del servidor.
6. **Cookies y sesiones**: las gestiona el proveedor de autenticación con flags `HttpOnly`, `Secure` (en producción) y `SameSite`. No las implementes a mano.
7. **Dependencias**: las versiones están fijadas por el perfil de compatibilidad; actualiza solo con una decisión documentada.
8. **Pagos**: un pago NUNCA se da por aprobado porque el navegador volvió a una página de éxito. Se confirma con webhooks verificados y consulta al proveedor desde el servidor (ver `docs/PAYMENTS.md`).
9. **Rate limiting**: los endpoints públicos sensibles usan el limitador distribuido (ver `docs/EXTRAS.md`).

## Checklist antes de producción

- [ ] Todas las variables de `.env.example` configuradas en el hosting.
- [ ] Ninguna clave secreta con prefijo `NEXT_PUBLIC_`.
- [ ] Dominio de producción registrado en los proveedores externos (autenticación, pagos).
- [ ] Credenciales de producción distintas de las de desarrollo.
