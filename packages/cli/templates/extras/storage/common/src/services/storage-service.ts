import "server-only";
import { getStorage } from "@/lib/storage";
import { validateUpload } from "@/lib/storage/validation";

/**
 * Servicio de archivos de ejemplo. Recibe un `File` (p. ej. de `FormData` en una
 * Server Action), lo valida y lo guarda con el proveedor del backend elegido.
 *
 * AUTORIZACIÓN: este servicio NO sabe quién llama. Antes de usarlo comprueba la
 * sesión en la Server Action o el Route Handler, y guarda la llave devuelta junto
 * al dueño en tu base de datos para poder autorizar lecturas y borrados.
 */
export async function saveUpload(file: File): Promise<{ key: string }> {
  const { body, contentType, extension } = await validateUpload(file);
  // Nombre generado en el servidor: nunca uses el nombre del cliente como ruta.
  const key = `uploads/${crypto.randomUUID()}.${extension}`;
  return getStorage().upload({ key, body, contentType });
}

/** URL temporal de lectura de un archivo previamente guardado. */
export async function getUploadUrl(key: string): Promise<string> {
  return getStorage().getUrl(key);
}

export async function deleteUpload(key: string): Promise<void> {
  await getStorage().remove(key);
}
