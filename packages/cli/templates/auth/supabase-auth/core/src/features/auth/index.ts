// API pública de la feature "auth". El resto de la aplicación importa SOLO desde este archivo.
export { signOutAction } from "./actions/sign-out";
<%#if authPassword%>
export { PasswordForm } from "./components/password-form";
<%#endif%>
<%#if authGoogle%>
export { GoogleButton } from "./components/google-button";
<%#endif%>
<%#if authMagicLink%>
export { MagicLinkForm } from "./components/magic-link-form";
<%#endif%>
<%#if authOtp%>
export { OtpForm } from "./components/otp-form";
<%#endif%>
