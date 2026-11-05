import { SignIn } from "@clerk/nextjs";

// Página de inicio de sesión con el componente oficial de Clerk. La ruta catch-all
// `[[...sign-in]]` es obligatoria: Clerk usa subrutas internas (verificación, segundo factor).
// Los métodos disponibles se configuran en el Dashboard de Clerk (método elegido al crear
// el proyecto: Solo Google); ver docs/AUTHENTICATION.md.
export default function SignInPage() {
  return (
    <div className="flex justify-center">
      <SignIn />
    </div>
  );
}
