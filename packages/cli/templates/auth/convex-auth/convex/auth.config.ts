// Le dice a Convex en qué emisor confiar al validar los tokens de sesión: el propio deployment.
// CONVEX_SITE_URL la define Convex automáticamente (no la configures a mano). Normalmente no necesitas
// editar este archivo.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
