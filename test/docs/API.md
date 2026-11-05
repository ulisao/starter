# API: Server Actions y Route Handlers

## Propósito

Catálogo de los puntos de entrada del servidor. Actualízalo cada vez que agregues o cambies uno.

## Reglas comunes

1. Validar la entrada con Zod (`safeParse`) antes de usarla.
2. Comprobar identidad y permisos en el servidor.
3. Responder errores con `AppError` / `errorResponse` (`src/lib/errors.ts`): nunca filtrar stacks.
4. Mantener el handler delgado: la lógica va en `src/services/`.

## Server Actions

| Acción | Archivo | Descripción |
| --- | --- | --- |
| `submitContact` | `src/features/contact/actions.ts` | Valida y procesa el formulario de contacto. |

## Route Handlers

Formato recomendado (`src/app/api/<recurso>/route.ts`):

```ts
import { z } from "zod";
import { AppError, errorResponse } from "@/lib/errors";

const bodySchema = z.object({ title: z.string().trim().min(1) });

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("Datos inválidos.", 422, "validation");
    // ...llamar a un servicio de src/services...
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
```
