import "server-only";
import { AppError } from "@/lib/errors";

/**
 * Reglas de subida de archivos. Ajusta estas constantes a tu producto:
 * - MAX_UPLOAD_BYTES: tamaño máximo por archivo. Next.js también limita el cuerpo
 *   de las Server Actions (`serverActions.bodySizeLimit`, 1 MB por defecto); si
 *   subes archivos más grandes por una acción, súbelo en next.config.ts.
 * - ALLOWED_TYPES: lista cerrada de tipos permitidos con su extensión y firma
 *   (primeros bytes reales del archivo). Añade un tipo solo si sabes validar su firma.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, { extension: string; signature: number[] }> = {
  "image/png": { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46] },
};

export interface ValidatedUpload {
  body: Uint8Array;
  contentType: string;
  extension: string;
}

/**
 * Valida tamaño y tipo en el servidor. `file.type` lo declara el cliente y se
 * puede falsificar, por eso además se comprueba la firma real del contenido.
 */
export async function validateUpload(file: File): Promise<ValidatedUpload> {
  if (file.size === 0) throw new AppError("El archivo está vacío.", 400, "empty_file");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AppError(
      `El archivo supera el máximo de ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
      413,
      "file_too_large",
    );
  }
  const rule = ALLOWED_TYPES[file.type];
  if (!rule) {
    throw new AppError(
      `Tipo de archivo no permitido. Permitidos: ${Object.keys(ALLOWED_TYPES).join(", ")}.`,
      415,
      "unsupported_file_type",
    );
  }
  const body = new Uint8Array(await file.arrayBuffer());
  if (!rule.signature.every((byte, i) => body[i] === byte)) {
    throw new AppError("El contenido no coincide con el tipo declarado.", 415, "file_type_mismatch");
  }
  return { body, contentType: file.type, extension: rule.extension };
}
