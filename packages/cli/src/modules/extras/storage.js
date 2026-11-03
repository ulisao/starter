// Extra Storage: almacenamiento de archivos. El adaptador depende del backend:
//   postgres → S3-compatible, supabase → Supabase Storage, convex → Convex File Storage.
// `extra-storage` aporta lo común (interfaz, validación, servicio, doc); cada adaptador
// aporta `src/lib/storage/index.ts` y sus dependencias/variables.

const hasStorage = (cfg) => cfg.extras.includes('storage');

const COMMON_STACK = 'Storage de archivos: interfaz `StorageProvider` (`src/lib/storage`) con validación de tipo/tamaño en servidor';

export default [
  {
    id: 'extra-storage',
    when: hasStorage,
    templates: 'extras/storage/common',
    summary: 'Subida/lectura/borrado de archivos con adaptador según el backend (ver docs/extras/storage.md).',
    stack: [COMMON_STACK],
    notes: [
      'Storage: usa siempre `getStorage()` (`src/lib/storage`) desde el servidor; ejemplo en `src/services/storage-service.ts`. Autoriza al usuario antes de subir/leer/borrar. Ver `docs/extras/storage.md`.',
    ],
  },
  {
    id: 'extra-storage-s3',
    when: (cfg) => hasStorage(cfg) && cfg.backend === 'postgres',
    templates: 'extras/storage/s3',
    dependencies: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
    env: [
      { key: 'S3_BUCKET', description: 'Nombre del bucket (privado).', secret: false, example: 'mi-bucket', where: 'Panel de tu proveedor S3-compatible.' },
      { key: 'S3_REGION', description: 'Región del bucket ("auto" en Cloudflare R2).', secret: false, example: 'us-east-1', where: 'Panel de tu proveedor.' },
      { key: 'S3_ENDPOINT', description: 'Endpoint del proveedor; vacío para AWS S3.', secret: false, example: '', where: 'R2: https://<ACCOUNT_ID>.r2.cloudflarestorage.com; MinIO: http://localhost:9000.' },
      { key: 'S3_FORCE_PATH_STYLE', description: '"true" para MinIO y proveedores que lo exigen.', secret: false, example: 'false', where: 'Documentación de tu proveedor.' },
      { key: 'S3_ACCESS_KEY_ID', description: 'Access key del bucket.', secret: true, example: '', where: 'Panel de tu proveedor (credenciales de API).' },
      { key: 'S3_SECRET_ACCESS_KEY', description: 'Secret de la access key.', secret: true, example: '', where: 'Panel de tu proveedor (se muestra una sola vez).' },
    ],
    stack: ['Adaptador de Storage S3-compatible (`@aws-sdk/client-s3`, URLs prefirmadas)'],
  },
  {
    id: 'extra-storage-supabase',
    when: (cfg) => hasStorage(cfg) && cfg.backend === 'supabase',
    templates: 'extras/storage/supabase',
    dependencies: ['@supabase/supabase-js'],
    env: [
      { key: 'SUPABASE_STORAGE_BUCKET', description: 'Nombre del bucket privado de Supabase Storage.', secret: false, example: 'uploads', where: 'Supabase Dashboard → Storage.' },
      { key: 'SUPABASE_SECRET_KEY', description: 'Clave secreta de Supabase (sb_secret_...), solo servidor; se salta RLS.', secret: true, example: '', where: 'Supabase Dashboard → Project Settings → API Keys.' },
    ],
    stack: ['Adaptador de Storage con Supabase Storage (`@supabase/supabase-js`, URLs firmadas)'],
  },
  {
    id: 'extra-storage-convex',
    when: (cfg) => hasStorage(cfg) && cfg.backend === 'convex',
    templates: 'extras/storage/convex',
    dependencies: ['convex'],
    env: [
      { key: 'CONVEX_STORAGE_SECRET', description: 'Secreto compartido que protege las funciones convex/files.ts (defínelo también en Convex).', secret: true, example: '', where: 'Valor largo aleatorio; en Convex: `npx convex env set CONVEX_STORAGE_SECRET <valor>`.' },
    ],
    stack: ['Adaptador de Storage con Convex File Storage (`convex/files.ts`)'],
  },
];
