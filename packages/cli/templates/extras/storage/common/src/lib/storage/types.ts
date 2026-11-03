/**
 * Contrato común del almacenamiento de archivos.
 *
 * La aplicación depende SOLO de esta interfaz; el adaptador concreto depende del
 * backend elegido al crear el proyecto y vive en `src/lib/storage/index.ts`.
 * Las llaves (`key`) son opacas: guarda en tu base de datos exactamente la que
 * devuelve `upload`, porque algunos proveedores (p. ej. Convex) la generan ellos.
 */
export interface StorageUploadInput {
  /** Ruta deseada del objeto (S3 y Supabase la respetan; Convex la ignora). */
  key: string;
  body: Uint8Array;
  contentType: string;
}

export interface StorageProvider {
  /** Sube el archivo y devuelve la llave con la que se recupera después. */
  upload(input: StorageUploadInput): Promise<{ key: string }>;
  /** URL temporal de lectura (firmada cuando el proveedor lo soporta). */
  getUrl(key: string, options?: { expiresInSeconds?: number }): Promise<string>;
  remove(key: string): Promise<void>;
}
