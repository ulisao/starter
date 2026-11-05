// Tailwind CSS v4 se integra como plugin de PostCSS. No requiere tailwind.config.js:
// los tokens de diseño se declaran con variables CSS en src/styles/globals.css.
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
