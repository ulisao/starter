import { getPrisma } from "@/lib/database/prisma";
import { errorResponse, AppError } from "@/lib/errors";
import { requireUserId } from "@/lib/auth/session";

// Ejemplo de autorización en el servidor: devuelve el perfil del usuario autenticado.
// Patrón a seguir en cualquier Route Handler o Server Action protegido:
//   1. obtener el id del usuario con requireUserId() (nunca desde el cuerpo ni la URL);
//   2. filtrar SIEMPRE los datos por ese id.
export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) throw new AppError("Usuario no encontrado.", 404, "not_found");
    return Response.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
