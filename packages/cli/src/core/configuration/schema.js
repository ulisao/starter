// Esquema de la configuración de Baretta Starter y reglas de validación.
//
// Este archivo es la ÚNICA fuente de verdad sobre qué opciones existen y qué
// combinaciones son válidas. El wizard, los flags de la CLI, los módulos y los
// tests leen de acá. Si agregás una opción (un backend, un proveedor de auth,
// un extra), empezá por declararla en estas listas.

export const FRAMEWORKS = ['nextjs']; // Astro queda reservado para la v2.0.
export const BACKENDS = ['convex', 'supabase', 'postgres'];
export const AUTHS = ['none', 'clerk', 'supabase-auth', 'better-auth', 'convex-auth'];
export const AUTH_METHODS = ['password', 'password-google', 'google', 'magic-link', 'otp'];
export const PAYMENT_TYPES = ['one-time', 'subscription'];
export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'];
export const INSTALL_MODES = ['ask', 'auto', 'skip'];
export const EXTRAS = [
  'resend',
  'sentry',
  'docker',
  'biome',
  'vitest',
  'playwright',
  'github-actions',
  'storage',
  'ai',
  'rate-limit',
  'analytics',
];

// Etiquetas legibles para el wizard y los resúmenes.
export const LABELS = {
  backend: { convex: 'Convex', supabase: 'Supabase', postgres: 'PostgreSQL propio' },
  auth: {
    none: 'Ninguna',
    clerk: 'Clerk',
    'supabase-auth': 'Supabase Auth',
    'better-auth': 'Better Auth',
    'convex-auth': 'Convex Auth (experimental)',
  },
  authMethod: {
    password: 'Email + contraseña',
    'password-google': 'Email + contraseña + Google',
    google: 'Solo Google',
    'magic-link': 'Magic link',
    otp: 'OTP por email',
  },
  payment: { 'one-time': 'Pago único', subscription: 'Suscripción' },
  extras: {
    resend: 'Resend (emails transaccionales)',
    sentry: 'Sentry (errores)',
    docker: 'Docker (herramientas de desarrollo local)',
    biome: 'Biome (lint + formato)',
    vitest: 'Vitest (tests unitarios)',
    playwright: 'Playwright (tests e2e)',
    'github-actions': 'GitHub Actions (CI)',
    storage: 'Storage (archivos)',
    ai: 'IA (OpenAI / Anthropic)',
    'rate-limit': 'Rate limiting',
    analytics: 'Analytics (eventos)',
  },
};

// Backends que usan Prisma. Convex tiene su propio modelo de datos nativo.
export const PRISMA_BACKENDS = ['supabase', 'postgres'];

// Qué backends admite cada proveedor de autenticación.
// Supabase Auth vive dentro de Supabase; Convex Auth vive dentro de Convex.
const AUTH_BACKENDS = {
  none: BACKENDS,
  clerk: BACKENDS,
  'better-auth': BACKENDS,
  'supabase-auth': ['supabase'],
  'convex-auth': ['convex'],
};

// Métodos que cada proveedor soporta de verdad. Hoy los cuatro proveedores
// cubren los cinco métodos, pero se mantiene la tabla explícita para que, si un
// proveedor deja de soportar alguno, la validación lo rechace con un motivo.
const AUTH_METHOD_SUPPORT = {
  clerk: AUTH_METHODS,
  'supabase-auth': AUTH_METHODS,
  'better-auth': AUTH_METHODS,
  'convex-auth': AUTH_METHODS,
};

const NAME_RE = /^[a-z0-9][a-z0-9-_]*$/;

/** Valores por defecto: un proyecto mínimo y válido. */
export function defaultConfig() {
  return {
    name: 'my-app',
    framework: 'nextjs',
    backend: 'postgres',
    auth: 'none',
    authMethod: null,
    payments: { enabled: false, provider: null, type: null },
    extras: [],
    packageManager: 'npm',
    install: 'ask',
  };
}

/** Devuelve true si el backend usa Prisma. */
export const usesPrisma = (cfg) => PRISMA_BACKENDS.includes(cfg.backend);

/**
 * Valida una configuración completa.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateConfig(cfg) {
  const errors = [];
  const warnings = [];

  if (!cfg.name || !NAME_RE.test(cfg.name)) {
    errors.push(
      `Nombre de proyecto inválido "${cfg.name}": usá minúsculas, números, guiones y guion bajo (debe empezar con letra o número).`,
    );
  }
  if (!FRAMEWORKS.includes(cfg.framework)) {
    errors.push(`Framework "${cfg.framework}" no soportado. Solo existe: ${FRAMEWORKS.join(', ')}.`);
  }
  if (!BACKENDS.includes(cfg.backend)) {
    errors.push(`Backend "${cfg.backend}" inválido. Opciones: ${BACKENDS.join(', ')}.`);
  }
  if (!AUTHS.includes(cfg.auth)) {
    errors.push(`Autenticación "${cfg.auth}" inválida. Opciones: ${AUTHS.join(', ')}.`);
  } else if (BACKENDS.includes(cfg.backend) && !AUTH_BACKENDS[cfg.auth].includes(cfg.backend)) {
    errors.push(
      `${LABELS.auth[cfg.auth]} solo funciona con: ${AUTH_BACKENDS[cfg.auth]
        .map((b) => LABELS.backend[b])
        .join(', ')}. Elegiste ${LABELS.backend[cfg.backend]}.`,
    );
  }

  if (cfg.auth === 'none') {
    if (cfg.authMethod) errors.push('Sin autenticación no se puede definir un método de acceso.');
  } else if (AUTHS.includes(cfg.auth)) {
    if (!AUTH_METHODS.includes(cfg.authMethod)) {
      errors.push(`Método de acceso "${cfg.authMethod}" inválido. Opciones: ${AUTH_METHODS.join(', ')}.`);
    } else if (!AUTH_METHOD_SUPPORT[cfg.auth].includes(cfg.authMethod)) {
      errors.push(`${LABELS.auth[cfg.auth]} no soporta el método "${LABELS.authMethod[cfg.authMethod]}".`);
    }
  }

  const extras = cfg.extras ?? [];
  for (const e of extras) if (!EXTRAS.includes(e)) errors.push(`Extra desconocido: "${e}".`);
  if (new Set(extras).size !== extras.length) errors.push('La lista de extras tiene duplicados.');

  if (cfg.payments?.enabled) {
    if (cfg.payments.provider !== 'mercadopago') errors.push('El único proveedor de pagos soportado es mercadopago.');
    if (!PAYMENT_TYPES.includes(cfg.payments.type)) {
      errors.push(`Tipo de cobro "${cfg.payments.type}" inválido. Opciones: ${PAYMENT_TYPES.join(', ')}.`);
    }
  } else if (cfg.payments?.provider || cfg.payments?.type) {
    errors.push('Con pagos desactivados no se puede indicar proveedor ni tipo.');
  }

  if (!PACKAGE_MANAGERS.includes(cfg.packageManager)) {
    errors.push(`Package manager "${cfg.packageManager}" inválido. Opciones: ${PACKAGE_MANAGERS.join(', ')}.`);
  }
  if (!INSTALL_MODES.includes(cfg.install)) {
    errors.push(`Modo de instalación "${cfg.install}" inválido. Opciones: ${INSTALL_MODES.join(', ')}.`);
  }

  // Advertencias (no bloquean la generación).
  if (['better-auth', 'convex-auth'].includes(cfg.auth) && ['magic-link', 'otp'].includes(cfg.authMethod) && !extras.includes('resend')) {
    warnings.push(
      'Magic link / OTP necesitan enviar emails. Sin el extra Resend, en desarrollo los códigos y enlaces se imprimen en la consola del servidor; en producción debés configurar un proveedor de email.',
    );
  }
  if (cfg.payments?.enabled && cfg.auth === 'none') {
    warnings.push('Cobrar sin autenticación significa que los pagos no quedan asociados a un usuario. Revisá docs/PAYMENTS.md.');
  }
  return { errors, warnings };
}
