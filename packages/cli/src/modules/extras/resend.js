// Extra Resend: emails transaccionales desde el servidor.
// Otros módulos (por ejemplo magic link / OTP) importan `sendEmail` de `src/lib/email/send.ts`.

export default {
  id: 'extra-resend',
  when: (cfg) => cfg.extras.includes('resend'),
  templates: 'extras/resend',
  summary: 'Resend: emails transaccionales con `sendEmail()` (server-only) en `src/lib/email/send.ts`.',
  dependencies: ['resend'],
  env: [
    {
      key: 'RESEND_API_KEY',
      description: 'API key de Resend para enviar emails desde el servidor.',
      secret: true,
      example: 're_xxxxxxxxxxxxxxxxxxxxxxxx',
      where: 'resend.com → API Keys → Create API Key (permiso "Sending access").',
    },
    {
      key: 'EMAIL_FROM',
      description: 'Remitente de los emails. Debe pertenecer a un dominio verificado en Resend.',
      secret: false,
      example: 'Mi App <no-reply@miapp.com>',
      where: 'Un dominio verificado en resend.com → Domains. Para pruebas: onboarding@resend.dev.',
    },
  ],
  stack: ['Resend (emails transaccionales)'],
  notes: [
    'Resend: envía emails con `sendEmail({ to, subject, text, html? })` de `src/lib/email/send.ts` (solo servidor). Guía y verificación de dominio en `docs/extras/resend.md`.',
  ],
};
