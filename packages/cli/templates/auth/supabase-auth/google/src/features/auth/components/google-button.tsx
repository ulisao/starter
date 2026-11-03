import { Button } from "@/components/ui/button";
import { signInWithGoogleAction } from "../actions/google";

// Server Component: un <form> con Server Action no necesita JavaScript en el navegador.
export function GoogleButton() {
  return (
    <form action={signInWithGoogleAction}>
      <Button type="submit" variant="outline" className="w-full">
        Continuar con Google
      </Button>
    </form>
  );
}
