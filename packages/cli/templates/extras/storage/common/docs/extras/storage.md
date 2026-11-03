# Storage (archivos)

## Propósito

Subir, leer (con URL temporal) y borrar archivos con una interfaz común (`StorageProvider`). El adaptador depende del backend de este proyecto: **<%= backendLabel %>**.

## Arquitectura

```text
src/lib/storage/types.ts       Interfaz StorageProvider: upload, getUrl, remove
src/lib/storage/index.ts       getStorage(): adaptador de <%= backendLabel %>
src/lib/storage/validation.ts  Validación de tamaño, tipo y firma del archivo (servidor)
src/services/storage-service.ts  Servicio de ejemplo: saveUpload / getUploadUrl / deleteUpload
```

Todo es `server-only`. Los clientes se crean al primer uso, por lo que `next build` no exige credenciales.

<%#if hasPostgres%>
## Configuración: almacenamiento S3-compatible

El adaptador usa `@aws-sdk/client-s3` con URLs prefirmadas y funciona con cualquier servicio compatible con S3. No hay un proveedor por defecto: elige uno y configura las variables.

| Proveedor | `S3_ENDPOINT` | `S3_REGION` | `S3_FORCE_PATH_STYLE` |
| --- | --- | --- | --- |
| AWS S3 | vacío | región del bucket (p. ej. `us-east-1`) | `false` |
| Cloudflare R2 | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | `auto` | `false` |
| MinIO (local) | `http://localhost:9000` | `us-east-1` | `true` |

1. Crea un bucket **privado** en tu proveedor.
2. Crea una credencial (access key + secret) con permisos de lectura, escritura y borrado solo sobre ese bucket.
3. Completa `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` y `S3_FORCE_PATH_STYLE` en `.env.local`.

Variables secretas: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
<%#endif%>
<%#if hasSupabase%>
## Configuración: Supabase Storage

El adaptador usa `@supabase/supabase-js` en el servidor con la **clave secreta** (`SUPABASE_SECRET_KEY`, formato `sb_secret_...`), que se salta las políticas RLS. Nunca la expongas con `NEXT_PUBLIC_`.

1. Supabase Dashboard → Storage → crea un bucket **privado** y pon su nombre en `SUPABASE_STORAGE_BUCKET`.
2. Dashboard → Project Settings → API Keys → copia la clave secreta a `SUPABASE_SECRET_KEY`.
3. `NEXT_PUBLIC_SUPABASE_URL` ya viene de la configuración del backend.

Como la clave secreta ignora RLS, autoriza al usuario en tu código antes de llamar al servicio.
<%#endif%>
<%#if hasConvex%>
## Configuración: Convex File Storage

Usa el almacenamiento de archivos nativo de Convex. El servidor de Next.js pide una URL de subida a Convex, sube el archivo y guarda el `storageId` devuelto (esa es la llave).

1. El archivo `convex/files.ts` expone tres mutaciones protegidas por un secreto compartido.
2. Genera un valor largo aleatorio y defínelo en los dos lados:
   - Convex: `<%= execCmd %> convex env set CONVEX_STORAGE_SECRET <valor>`
   - `.env.local`: `CONVEX_STORAGE_SECRET=<valor>`
3. `NEXT_PUBLIC_CONVEX_URL` ya viene de la configuración del backend.

Las URLs de lectura de Convex no son firmadas ni expiran: trátalas como enlaces que cualquiera con la URL puede abrir.
<%#endif%>

## Validación de archivos

`validateUpload` (en `src/lib/storage/validation.ts`) se ejecuta en el servidor antes de subir: rechaza archivos vacíos, mayores a `MAX_UPLOAD_BYTES` (5 MB), de un tipo fuera de la lista cerrada (PNG, JPEG, PDF) o cuyo contenido no coincide con la firma del tipo declarado. Para permitir otro tipo, añádelo a `ALLOWED_TYPES` con su firma. Si subes por Server Action, revisa también `serverActions.bodySizeLimit` en `next.config.ts` (1 MB por defecto).

## Uso

```ts
// Server Action (comprueba la sesión ANTES)
import { saveUpload, getUploadUrl } from "@/services/storage-service";

const { key } = await saveUpload(file); // guarda `key` en tu base de datos junto al dueño
const url = await getUploadUrl(key);
```

## Errores frecuentes

- `Falta la variable de entorno ...`: completa las variables de la sección de configuración.
- `unsupported_file_type` / `file_type_mismatch`: el tipo no está permitido o el contenido no corresponde.
- `storage_error` (502): el proveedor rechazó la operación (credenciales, bucket inexistente, permisos). El detalle queda en los logs del servidor.
