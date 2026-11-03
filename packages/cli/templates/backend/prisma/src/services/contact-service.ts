import { getPrisma } from "@/lib/database/prisma";
import type { ContactInput } from "@/features/contact/schemas/contact-schema";

/**
 * Lógica de negocio del formulario de contacto.
 *
 * Los servicios (src/services) contienen reglas reutilizables y NO conocen HTTP,
 * formularios ni React: reciben datos ya validados. Así se pueden llamar desde una
 * Server Action, un Route Handler o un test sin cambios.
 *
 * Este archivo reemplaza al servicio base (que solo registraba en consola) para
 * guardar el mensaje con Prisma. Requiere haber aplicado la primera migración
 * (ver docs/DATABASE.md).
 */
export async function processContactMessage(input: ContactInput): Promise<void> {
  await getPrisma().contactMessage.create({
    data: { name: input.name, email: input.email, message: input.message },
  });
}
