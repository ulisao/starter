// Comando `baretta create`: wizard → validación → resumen → generación → instalación.

import { parseArgs } from 'node:util';
import { resolve, relative } from 'node:path';
import * as p from '@clack/prompts';
import { runWizard } from '../prompts/wizard.js';
import { validateConfig, LABELS } from '../../core/configuration/schema.js';
import { plan, writeProject } from '../../core/generator/index.js';
import { commandsFor, install, isAvailable, runScript } from '../../core/package-manager/index.js';

const OPTIONS = {
  backend: { type: 'string' },
  auth: { type: 'string' },
  'auth-method': { type: 'string' },
  payments: { type: 'string' }, // none | one-time | subscription
  extras: { type: 'string' }, // lista separada por comas
  pm: { type: 'string' },
  install: { type: 'string' }, // ask | auto | skip
  dir: { type: 'string' },
  yes: { type: 'boolean', short: 'y' },
  help: { type: 'boolean', short: 'h' },
};

export const CREATE_HELP = `
Uso: baretta create [nombre] [opciones]

Sin opciones, inicia el asistente interactivo.

Opciones (cada una evita su pregunta del asistente):
  --backend <convex|supabase|postgres>
  --auth <none|clerk|supabase-auth|better-auth|convex-auth>
  --auth-method <password|password-google|google|magic-link|otp>
  --payments <none|one-time|subscription>
  --extras <lista>     Ej: resend,sentry,biome,vitest
  --pm <npm|pnpm|yarn|bun>
  --install <ask|auto|skip>
  --dir <carpeta>      Carpeta de destino (por defecto ./<nombre>)
  -y, --yes            No preguntar nada; usa valores por defecto
  -h, --help           Muestra esta ayuda
`;

export async function createCommand(argv) {
  const { values, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  if (values.help) return console.log(CREATE_HELP);

  p.intro('BARETTA STARTER — Build faster. Build better.');

  const flags = {
    name: positionals[0],
    backend: values.backend,
    auth: values.auth,
    authMethod: values['auth-method'],
    payments: values.payments,
    extras: values.extras === undefined ? undefined : values.extras.split(',').map((s) => s.trim()).filter(Boolean),
    pm: values.pm,
    install: values.install,
  };
  const cfg = await runWizard(flags, !!values.yes);

  const { errors, warnings } = validateConfig(cfg);
  if (errors.length) {
    p.log.error(errors.join('\n'));
    process.exitCode = 1;
    return p.outro('Corregí la configuración y volvé a intentar.');
  }

  let result;
  try {
    result = await plan(cfg);
  } catch (e) {
    p.log.error(e.message);
    process.exitCode = 1;
    return p.outro('No se pudo preparar el proyecto.');
  }

  const targetDir = resolve(values.dir ?? cfg.name);
  const statusLabel = { verified: 'verificada', candidate: 'candidata (aún no validada completamente)', experimental: 'EXPERIMENTAL' }[result.status];
  p.note(
    [
      `Carpeta:        ${relative(process.cwd(), targetDir) || '.'}`,
      `Framework:      Next.js + TypeScript + Tailwind`,
      `Backend:        ${LABELS.backend[cfg.backend]}${cfg.backend === 'convex' ? '' : ' + Prisma'}`,
      `Autenticación:  ${LABELS.auth[cfg.auth]}${cfg.authMethod ? ` — ${LABELS.authMethod[cfg.authMethod]}` : ''}`,
      `Pagos:          ${cfg.payments.enabled ? `Mercado Pago — ${LABELS.payment[cfg.payments.type]}` : 'no'}`,
      `Extras:         ${cfg.extras.length ? cfg.extras.join(', ') : 'ninguno'}`,
      `Deploy:         Vercel + Docker`,
      `Package manager: ${cfg.packageManager}`,
      `Compatibilidad: perfil stable — combinación ${statusLabel}`,
    ].join('\n'),
    'Configuración',
  );
  for (const w of warnings) p.log.warn(w);
  if (result.status !== 'verified') {
    p.log.warn('Esta combinación no está marcada como "verified" en el registro de compatibilidad. Revisá docs/COMPATIBILITY.md en el proyecto generado.');
  }

  if (!values.yes && !(await p.confirm({ message: '¿Continuar?', initialValue: true })) ) {
    return p.cancel('Cancelado. No se escribió ningún archivo.');
  }

  try {
    writeProject(result, targetDir);
  } catch (e) {
    p.log.error(e.message);
    process.exitCode = 1;
    return p.outro('No se escribió nada.');
  }
  p.log.success(`Proyecto creado en ${targetDir} (${result.files.size} archivos).`);

  // Instalación de dependencias. Si falla, el proyecto se conserva.
  const pm = cfg.packageManager;
  const cmds = commandsFor(pm);
  let doInstall = cfg.install === 'auto';
  if (cfg.install === 'ask') {
    doInstall = !!(await p.confirm({ message: `¿Instalar dependencias ahora con ${pm}? (ejecutará "${cmds.install}")`, initialValue: true }));
  }
  let installed = false;
  if (doInstall) {
    if (!isAvailable(pm)) p.log.warn(`No se encontró "${pm}" en este equipo; la instalación va a fallar.`);
    p.log.step(`Ejecutando "${cmds.install}" en ${targetDir}`);
    const r = await install(pm, targetDir);
    installed = r.ok;
    // Biome: las plantillas no están formateadas con su estilo; se formatea una vez para que `lint` (biome check) pase.
    if (r.ok && cfg.extras.includes('biome')) {
      const f = await runScript(pm, 'lint:fix', targetDir);
      if (!f.ok) p.log.warn('No se pudo formatear con Biome; ejecuta `lint:fix` a mano.');
    }
    if (!r.ok) p.log.error(`La instalación falló (código ${r.code}). El proyecto se conservó; corré "${cmds.install}" a mano dentro de la carpeta.`);
  }

  const rel = relative(process.cwd(), targetDir) || '.';
  const next = [`cd ${rel}`];
  if (!installed) next.push(cmds.install);
  next.push('cp .env.example .env.local   # y completá los valores (ver docs/ENVIRONMENT.md)');
  next.push(`${cmds.run} dev`);
  p.note(next.join('\n'), 'Próximos pasos');
  p.outro('Listo. Leé AGENTS.md y docs/ antes de pedirle cambios a un agente.');
}
