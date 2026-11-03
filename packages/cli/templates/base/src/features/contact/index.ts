// API pública de la feature "contact". El resto de la aplicación importa SOLO desde
// este archivo, nunca desde sus carpetas internas. Así la feature puede reorganizarse
// sin romper a quienes la usan.
export { ContactForm } from "./components/contact-form";
