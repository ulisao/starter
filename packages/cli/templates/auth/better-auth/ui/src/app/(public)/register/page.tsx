import type { Metadata } from "next";
import { AuthForm } from "@/features/auth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
