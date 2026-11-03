// Wizard interactivo de `baretta create`.
//
// Regla: cada pregunta se hace SOLO si (a) no vino resuelta por un flag y (b) es
// relevante según las respuestas anteriores. Con --yes no se pregunta nada y se
// usan los valores por defecto para lo que falte.

import * as p from '@clack/prompts';
import {
  BACKENDS, AUTHS, AUTH_METHODS, PAYMENT_TYPES, PACKAGE_MANAGERS, EXTRAS, LABELS, defaultConfig, usesPrisma,
} from '../../core/configuration/schema.js';
import { detectPackageManager, isAvailable } from '../../core/package-manager/index.js';

// Auth que tiene sentido ofrecer para cada backend (la validación final es la de schema.js).
const AUTH_FOR_BACKEND = {
  convex: ['clerk', 'better-auth', 'convex-auth', 'none'],
  supabase: ['supabase-auth', 'clerk', 'better-auth', 'none'],
  postgres: ['clerk', 'better-auth', 'none'],
};

/** Si el usuario cancela con Ctrl+C se corta limpiamente, sin escribir nada. */
const ask = async (promise) => {
  const v = await promise;
  if (p.isCancel(v)) {
    p.cancel('Operación cancelada. No se escribió ningún archivo.');
    process.exit(0);
  }
  return v;
};

/**
 * @param {object} flags valores recibidos por línea de comandos (pueden ser undefined)
 * @param {boolean} yes  modo no interactivo
 */
export async function runWizard(flags, yes) {
  const base = defaultConfig();
  const cfg = { ...base };
  const interactive = !yes;

  cfg.name = flags.name ?? (interactive ? await ask(p.text({
    message: 'Nombre del proyecto:',
    placeholder: 'my-awesome-project',
    validate: (v) => (/^[a-z0-9][a-z0-9-_]*$/.test(v ?? '') ? undefined : 'Usá minúsculas, números, guiones y guion bajo.'),
  })) : base.name);

  cfg.backend = flags.backend ?? (interactive ? await ask(p.select({
    message: 'Backend:',
    options: BACKENDS.map((b) => ({ value: b, label: LABELS.backend[b] })),
  })) : base.backend);

  if (interactive && usesPrisma(cfg) && !flags.backend) {
    p.log.info('ORM: Prisma (automático según el backend).');
  }

  cfg.auth = flags.auth ?? (interactive ? await ask(p.select({
    message: 'Autenticación:',
    options: (AUTH_FOR_BACKEND[cfg.backend] ?? AUTHS).map((a) => ({ value: a, label: LABELS.auth[a] })),
  })) : base.auth);

  if (cfg.auth !== 'none') {
    cfg.authMethod = flags.authMethod ?? (interactive ? await ask(p.select({
      message: 'Método de acceso:',
      options: AUTH_METHODS.map((m) => ({ value: m, label: LABELS.authMethod[m] })),
    })) : 'password');
  } else {
    cfg.authMethod = null;
  }

  // Pagos: flag --payments = none | one-time | subscription
  let payType = flags.payments;
  if (payType === undefined) {
    if (interactive && (await ask(p.confirm({ message: '¿El proyecto necesita cobrar? (Mercado Pago)', initialValue: false })))) {
      payType = await ask(p.select({
        message: 'Tipo de cobro:',
        options: PAYMENT_TYPES.map((t) => ({ value: t, label: LABELS.payment[t] })),
      }));
    } else payType = 'none';
  }
  cfg.payments = payType === 'none' ? { enabled: false, provider: null, type: null } : { enabled: true, provider: 'mercadopago', type: payType };

  cfg.extras = flags.extras ?? (interactive ? await ask(p.multiselect({
    message: 'Extras (espacio para marcar, enter para continuar):',
    options: EXTRAS.map((e) => ({ value: e, label: LABELS.extras[e] })),
    required: false,
  })) : []);

  const detected = detectPackageManager();
  cfg.packageManager = flags.pm ?? (interactive ? await ask(p.select({
    message: 'Package manager:',
    initialValue: detected,
    options: PACKAGE_MANAGERS.map((m) => ({
      value: m,
      label: m === detected ? `${m} (detectado)` : m,
      hint: isAvailable(m) ? undefined : 'no está instalado en este equipo',
    })),
  })) : detected);

  cfg.install = flags.install ?? (interactive ? await ask(p.select({
    message: '¿Cómo querés instalar las dependencias?',
    initialValue: 'ask',
    options: [
      { value: 'ask', label: 'Preguntarme al terminar' },
      { value: 'auto', label: 'Instalar automáticamente' },
      { value: 'skip', label: 'No instalar; lo hago manualmente' },
    ],
  })) : 'skip');

  return cfg;
}
