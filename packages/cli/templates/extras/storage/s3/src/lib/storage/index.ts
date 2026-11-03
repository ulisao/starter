import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireEnv } from "@/lib/env";
import type { StorageProvider } from "./types";

export type { StorageProvider, StorageUploadInput } from "./types";

let cached: StorageProvider | undefined;

/**
 * Adaptador S3-compatible (AWS S3, Cloudflare R2, MinIO, Backblaze B2, etc.).
 * El proveedor concreto se elige SOLO con variables de entorno (ver
 * docs/extras/storage.md). Las lecturas usan URLs prefirmadas: el bucket puede
 * (y debe) permanecer privado.
 *
 * El cliente se crea al primer uso, no al importar, para que `next build` no
 * exija credenciales.
 */
export function getStorage(): StorageProvider {
  if (cached) return cached;
  const bucket = requireEnv("S3_BUCKET");
  const client = new S3Client({
    region: requireEnv("S3_REGION"),
    // Vacío = AWS S3. Para R2/MinIO/B2 indica el endpoint de tu proveedor.
    endpoint: process.env.S3_ENDPOINT || undefined,
    // MinIO y algunos proveedores exigen direccionamiento por ruta.
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
  });

  cached = {
    async upload({ key, body, contentType }) {
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
      );
      return { key };
    },
    getUrl(key, { expiresInSeconds = 300 } = {}) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: expiresInSeconds,
      });
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
  return cached;
}
