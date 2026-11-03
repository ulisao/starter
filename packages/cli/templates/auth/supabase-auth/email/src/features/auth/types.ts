// Estado que devuelven las Server Actions de acceso a los formularios (useActionState).
export type AuthState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  // Solo en el flujo con código (OTP): correo al que se envió, para pedir el código.
  email?: string;
};

export const initialAuthState: AuthState = { ok: false, message: "" };
