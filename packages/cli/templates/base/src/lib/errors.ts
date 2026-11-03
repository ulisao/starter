/**
 * Error esperado de la aplicación (validación, permisos, recurso inexistente...).
 *
 * Diferenciarlo de un error inesperado permite responder con el código HTTP
 * correcto sin filtrar detalles internos al cliente.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code: string = "bad_request",
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Convierte cualquier error en una respuesta JSON consistente para Route Handlers.
 * Los errores inesperados se registran en el servidor y el cliente recibe un
 * mensaje genérico: nunca se devuelve el stack ni el mensaje interno.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error("[error no controlado]", error);
  return Response.json({ error: { code: "internal", message: "Error interno del servidor." } }, { status: 500 });
}
