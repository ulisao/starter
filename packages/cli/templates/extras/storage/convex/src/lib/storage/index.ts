import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { AppError } from "@/lib/errors";
import { requireEnv } from "@/lib/env";
import type { StorageProvider } from "./types";

export type { StorageProvider, StorageUploadInput } from "./types";

// Referencias a las funciones de `convex/files.ts` (no dependen de `convex/_generated`).
const generateUploadUrl = makeFunctionReference<"mutation", { secret: string }, string>(
  "files:generateUploadUrl",
);
const getFileUrl = makeFunctionReference<
  "mutation",
  { secret: string; storageId: string },
  string | null
>("files:getUrl");
const removeFile = makeFunctionReference<"mutation", { secret: string; storageId: string }, null>(
  "files:remove",
);

let cached: StorageProvider | undefined;

/**
 * Adaptador de Convex File Storage. Next.js (servidor) pide a Convex una URL de
 * subida, envía el archivo y recibe un `storageId`, que es la llave que debes
 * guardar. Las funciones de Convex están protegidas con CONVEX_STORAGE_SECRET
 * (secreto compartido, ver docs/extras/storage.md) para que no las pueda invocar
 * cualquiera desde un cliente.
 *
 * Nota: la URL que devuelve Convex para leer un archivo no es firmada ni
 * temporal; trátala como un enlace que quien lo tenga puede abrir.
 */
export function getStorage(): StorageProvider {
  if (cached) return cached;
  const client = new ConvexHttpClient(requireEnv("NEXT_PUBLIC_CONVEX_URL"));
  const secret = requireEnv("CONVEX_STORAGE_SECRET");

  cached = {
    async upload({ body, contentType }) {
      const uploadUrl = await client.mutation(generateUploadUrl, { secret });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: body as BodyInit,
      });
      if (!response.ok) {
        console.error("[storage] falló la subida a Convex", response.status);
        throw new AppError("No se pudo subir el archivo.", 502, "storage_error");
      }
      const { storageId } = (await response.json()) as { storageId: string };
      return { key: storageId };
    },
    async getUrl(key) {
      const url = await client.mutation(getFileUrl, { secret, storageId: key });
      if (!url) throw new AppError("Archivo no encontrado.", 404, "file_not_found");
      return url;
    },
    async remove(key) {
      await client.mutation(removeFile, { secret, storageId: key });
    },
  };
  return cached;
}
