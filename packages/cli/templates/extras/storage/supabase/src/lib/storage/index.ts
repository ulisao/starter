import "server-only";
import { createClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { requireEnv } from "@/lib/env";
import type { StorageProvider } from "./types";

export type { StorageProvider, StorageUploadInput } from "./types";

let cached: StorageProvider | undefined;

/**
 * Adaptador de Supabase Storage. Se ejecuta SOLO en el servidor con la clave
 * secreta (SUPABASE_SECRET_KEY), que se salta las políticas RLS: por eso la
 * autorización debe hacerse en tu código antes de llamar a este adaptador, y el
 * bucket debe ser privado. Las lecturas usan URLs firmadas temporales.
 *
 * El cliente se crea al primer uso, no al importar, para que `next build` no
 * exija credenciales.
 */
export function getStorage(): StorageProvider {
  if (cached) return cached;
  const bucket = requireEnv("SUPABASE_STORAGE_BUCKET");
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const files = () => supabase.storage.from(bucket);
  const fail = (message: string, error: unknown): never => {
    console.error(`[storage] ${message}`, error);
    throw new AppError("No se pudo completar la operación de archivos.", 502, "storage_error");
  };

  cached = {
    async upload({ key, body, contentType }) {
      const { error } = await files().upload(key, body, { contentType, upsert: false });
      if (error) fail("falló la subida", error);
      return { key };
    },
    async getUrl(key, { expiresInSeconds = 300 } = {}) {
      const { data, error } = await files().createSignedUrl(key, expiresInSeconds);
      if (error || !data) return fail("falló la URL firmada", error);
      return data.signedUrl;
    },
    async remove(key) {
      const { error } = await files().remove([key]);
      if (error) fail("falló el borrado", error);
    },
  };
  return cached;
}
