import { SignUp } from "@clerk/nextjs";

// Página de registro con el componente oficial de Clerk (ruta catch-all obligatoria).
// Si desactivas el registro público en el Dashboard de Clerk, elimina esta página.
export default function SignUpPage() {
  return (
    <div className="flex justify-center">
      <SignUp />
    </div>
  );
}
