// Generador: convierte una configuración validada en un conjunto de archivos.
//
// Se divide en dos pasos para que sea testeable sin tocar el disco:
//
//   plan(cfg)            → calcula TODOS los archivos en memoria (puro, sin I/O de escritura)
//   writeProject(p, dir) → escribe el plan en disco
//
// Composición por capas (ver docs/ARCHITECTURE.md): cada módulo (src/modules/**)
// declara cuándo aplica, qué plantillas aporta, qué dependencias necesita, qué
// variables de entorno define y qué notas deben conocer los agentes de IA.
// El generador NO sabe nada de Clerk, Convex ni Mercado Pago: solo compone módulos.

import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateConfig, usesPrisma, LABELS, EXTRAS } from '../configuration/schema.js';
import { loadProfile, resolveCompatibility, overallStatus } from '../compatibility/index.js';
import { render, walk, readTemplate } from '../filesystem/template.js';
import { commandsFor } from '../package-manager/index.js';

const SRC = fileURLToPath(new URL('../../', import.meta.url));
const TEMPLATES = fileURLToPath(new URL('../../../templates/', import.meta.url));
const STARTER_VERSION = '1.0.0';

// Orden de composición. Un módulo de una capa posterior puede sobreescribir
// archivos de una anterior SOLO si lo declara en `overrides`.
const LAYER_ORDER = ['base', 'backend', 'auth', 'payments', 'extras', 'deployment', 'docs'];

/** Descubre módulos: cada archivo en src/modules/<capa>/*.js exporta un módulo o un array. */
export async function loadModules() {
  const modules = [];
  const root = join(SRC, 'modules');
  for (const layer of readdirSync(root)) {
    const dir = join(root, layer);
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      const mod = (await import(pathToFileURL(join(dir, file)).href)).default;
      for (const m of [mod].flat()) modules.push({ layer, ...m });
    }
  }
  const ids = modules.map((m) => m.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`Módulo duplicado: ${dup}`);
  return modules.sort((a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer));
}

const call = (v, cfg) => (typeof v === 'function' ? v(cfg) : (v ?? []));

/** Banderas booleanas disponibles en las plantillas (`<%#if hasPrisma%>`). */
export function buildFlags(cfg) {
  const m = cfg.authMethod;
  const flags = {
    hasConvex: cfg.backend === 'convex',
    hasSupabase: cfg.backend === 'supabase',
    hasPostgres: cfg.backend === 'postgres',
    hasPrisma: usesPrisma(cfg),
    hasAuth: cfg.auth !== 'none',
    isClerk: cfg.auth === 'clerk',
    isSupabaseAuth: cfg.auth === 'supabase-auth',
    isBetterAuth: cfg.auth === 'better-auth',
    isConvexAuth: cfg.auth === 'convex-auth',
    authPassword: m === 'password' || m === 'password-google',
    authGoogle: m === 'password-google' || m === 'google',
    authMagicLink: m === 'magic-link',
    authOtp: m === 'otp',
    hasPayments: !!cfg.payments?.enabled,
    payOneTime: cfg.payments?.type === 'one-time',
    paySubscription: cfg.payments?.type === 'subscription',
    pmNpm: cfg.packageManager === 'npm',
    pmPnpm: cfg.packageManager === 'pnpm',
    pmYarn: cfg.packageManager === 'yarn',
    pmBun: cfg.packageManager === 'bun',
  };
  for (const e of EXTRAS) {
    const camel = e.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
    flags[`has${camel}`] = cfg.extras.includes(e);
  }
  return flags;
}

const mdBullets = (items) => (items.length ? items.map((i) => `- ${i}`).join('\n') : '- (ninguna)');

/**
 * Calcula el proyecto completo en memoria.
 * @returns {{ files: Map<string,string>, status: string, warnings: string[], packageJson: object, env: object[], modules: string[] }}
 */
export async function plan(rawCfg, { profileName = 'stable' } = {}) {
  const cfg = { framework: 'nextjs', extras: [], payments: { enabled: false, provider: null, type: null }, authMethod: null, install: 'ask', ...rawCfg };
  const { errors, warnings } = validateConfig(cfg);
  if (errors.length) throw new Error(`Configuración inválida:\n - ${errors.join('\n - ')}`);

  const profile = loadProfile(profileName);
  const compat = resolveCompatibility(cfg, profile);
  const allModules = await loadModules();
  const active = allModules.filter((m) => m.when(cfg));

  // ── 1. Dependencias, scripts y variables de entorno ────────────────────────────
  const deps = new Set();
  const devDeps = new Set();
  const scripts = {};
  const env = [];
  const stack = [];
  const notes = [];
  const extrasSummary = [];

  // Providers de React: cada módulo puede declarar { importLine, open, close, order }.
  // Se anidan por `order` (menor = más externo) dentro de src/components/providers.tsx.
  const providers = [];
  // Slots: puntos de extensión con nombre dentro de una plantilla (ej: las tablas del
  // schema de Convex). Cada módulo aporta texto; la plantilla lo imprime con <%= slot_nombre %>.
  // Todos los slots existen siempre (vacíos por defecto) para que las plantillas no fallen.
  const slots = {};
  for (const m of allModules) for (const name of Object.keys(m.slots ?? {})) slots[`slot_${name}`] = '';

  for (const m of active) {
    providers.push(...call(m.providers, cfg));
    for (const [name, text] of Object.entries(m.slots ?? {})) {
      const value = [call(text, cfg)].flat().join('\n');
      slots[`slot_${name}`] = [slots[`slot_${name}`], value].filter(Boolean).join('\n');
    }
    call(m.dependencies, cfg).forEach((d) => deps.add(d));
    call(m.devDependencies, cfg).forEach((d) => devDeps.add(d));
    for (const [k, v] of Object.entries(call(m.scripts, cfg) || {})) {
      if (k in scripts && scripts[k] !== v) throw new Error(`Conflicto de script "${k}" entre módulos (${m.id}).`);
      scripts[k] = v;
    }
    for (const e of call(m.env, cfg)) {
      if (e.secret && e.key.startsWith('NEXT_PUBLIC_')) {
        throw new Error(`${m.id}: la variable secreta ${e.key} no puede usar el prefijo NEXT_PUBLIC_ (se expondría al navegador).`);
      }
      if (env.some((x) => x.key === e.key)) throw new Error(`Variable de entorno duplicada ${e.key} (${m.id}).`);
      env.push({ module: m.id, ...e });
    }
    stack.push(...call(m.stack, cfg));
    notes.push(...call(m.notes, cfg));
    if (m.layer === 'extras' && m.summary) extrasSummary.push(`**${m.id.replace('extra-', '')}** — ${m.summary}`);
  }
  for (const d of devDeps) if (deps.has(d)) deps.delete(d); // una dependencia no puede estar en ambas listas

  const pin = (set) => Object.fromEntries([...set].sort().map((n) => [n, compat.versionOf(n)]));
  const packageJson = {
    name: cfg.name,
    version: '0.1.0',
    private: true,
    engines: { node: profile.node },
    scripts,
    dependencies: pin(deps),
    devDependencies: pin(devDeps),
  };
  for (const m of active) m.packageJson?.(packageJson, cfg);

  // ── 2. Contexto de plantillas ─────────────────────────────────────────────────
  const cmds = commandsFor(cfg.packageManager);
  const publicEnv = env.filter((e) => e.key.startsWith('NEXT_PUBLIC_'));
  const status = overallStatus(compat, profile, [...deps, ...devDeps]);
  const allPkgs = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const versionsTable = [
    '| Paquete | Versión | Estado |',
    '| --- | --- | --- |',
    ...Object.entries(allPkgs).map(([n, v]) => `| \`${n}\` | \`${v}\` | ${profile.packages[n]?.status ?? 'candidate'} |`),
  ].join('\n');

  providers.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  const ctx = {
    ...buildFlags(cfg),
    ...slots,
    providersImports: providers.map((p) => p.importLine).filter(Boolean).join('\n'),
    // JSX anidado (4 espacios de base = indentación dentro del `return (` de la plantilla).
    providersOpen: ['<>', ...providers.map((p) => p.open)].map((l, i) => `${'    ' + '  '.repeat(i)}${l}`).join('\n'),
    providersChildren: `${'    ' + '  '.repeat(providers.length + 1)}{children}`,
    providersClose: [...providers].reverse().map((p, k) => `${'    ' + '  '.repeat(providers.length - k)}${p.close}`).concat('    </>').join('\n'),
    name: cfg.name,
    backend: cfg.backend,
    backendLabel: LABELS.backend[cfg.backend],
    auth: cfg.auth,
    authLabel: LABELS.auth[cfg.auth],
    authMethod: cfg.authMethod ?? 'ninguno',
    authMethodLabel: cfg.authMethod ? LABELS.authMethod[cfg.authMethod] : 'ninguno',
    paymentType: cfg.payments?.type ?? 'ninguno',
    packageManager: cfg.packageManager,
    installCmd: cmds.install,
    ciInstallCmd: cmds.ci,
    runCmd: cmds.run,
    execCmd: cmds.exec,
    lockfile: cmds.lockfile,
    nodeRange: profile.node,
    nodeMajor: '22',
    profileName: profile.name,
    profileVersion: profile.version,
    starterVersion: STARTER_VERSION,
    compatStatus: status,
    stackList: mdBullets(stack),
    moduleNotes: notes.length ? mdBullets(notes) : '- (sin notas adicionales)',
    extrasSummary: extrasSummary.length ? mdBullets(extrasSummary) : '- (no se seleccionaron extras)',
    versionsTable,
    envTable: [
      '| Variable | Tipo | Módulo | Descripción |',
      '| --- | --- | --- | --- |',
      ...env.map((e) => `| \`${e.key}\` | ${e.secret ? '🔒 secreta' : 'pública/config'} | ${e.module} | ${e.description} |`),
    ].join('\n'),
    // Variables públicas: se incrustan en el JS del navegador en tiempo de build, así que
    // Docker necesita recibirlas como ARG. Se generan desde la lista de env de los módulos.
    dockerBuildArgs: publicEnv.length ? publicEnv.map((e) => `ARG ${e.key}\nENV ${e.key}=$${e.key}`).join('\n') : '# (sin variables NEXT_PUBLIC_*)',
    composeBuildArgs: publicEnv.length ? publicEnv.map((e) => `        ${e.key}: \${${e.key}:-}`).join('\n') : '        BARETTA_NO_ARGS: "1"',
    scriptsList:mdBullets(Object.keys(scripts).map((s) => `\`${cmds.run} ${s}\` → \`${scripts[s]}\``)),
  };

  // ── 3. Archivos de plantilla (con detección explícita de conflictos) ──────────
  const files = new Map();
  const owner = new Map();
  const add = (path, content, moduleId, overrides = []) => {
    if (files.has(path) && !overrides.includes(path)) {
      throw new Error(`Conflicto de archivo "${path}": lo escriben "${owner.get(path)}" y "${moduleId}". Si es intencional, "${moduleId}" debe declararlo en overrides.`);
    }
    files.set(path, content);
    owner.set(path, moduleId);
  };

  for (const m of active) {
    if (!m.templates) continue;
    const dir = join(TEMPLATES, m.templates);
    if (!existsSync(dir)) throw new Error(`El módulo ${m.id} apunta a templates/${m.templates}, que no existe.`);
    for (const { rel, abs } of walk(dir)) {
      add(rel, render(readTemplate(abs), ctx, `${m.templates}/${rel}`), m.id, m.overrides ?? []);
    }
  }

  // ── 4. Archivos generados por el núcleo ───────────────────────────────────────
  add('package.json', JSON.stringify(packageJson, null, 2) + '\n', 'core');
  add('.env.example', renderEnvExample(env), 'core');
  add(
    'baretta.config.json',
    JSON.stringify(
      {
        starterVersion: STARTER_VERSION,
        compatibilityProfile: profile.name,
        compatibilityStatus: status,
        framework: cfg.framework,
        backend: cfg.backend,
        orm: usesPrisma(cfg) ? 'prisma' : null,
        auth: cfg.auth,
        authMethod: cfg.authMethod,
        ui: 'tailwind',
        payments: cfg.payments?.enabled ? cfg.payments : { enabled: false, provider: null, type: null },
        deployment: ['vercel', 'docker'],
        extras: cfg.extras,
        packageManager: cfg.packageManager,
      },
      null,
      2,
    ) + '\n',
    'core',
  );

  return { files, status, warnings, packageJson, env, modules: active.map((m) => m.id), compat };
}

/** Genera .env.example agrupado por módulo, con el origen de cada valor. */
function renderEnvExample(env) {
  const out = ['# Copiá este archivo a .env.local y completá los valores.', '# NUNCA subas .env.local al repositorio.', ''];
  let current = null;
  for (const e of env) {
    if (e.module !== current) {
      current = e.module;
      out.push(`# ── ${current} ${'─'.repeat(Math.max(2, 50 - current.length))}`);
    }
    out.push(`# ${e.description}${e.secret ? ' [SECRETA: solo servidor]' : ''}`);
    if (e.where) out.push(`# Dónde obtenerla: ${e.where}`);
    out.push(`${e.key}=${e.example ?? ''}`, '');
  }
  return out.join('\n');
}

/** Escribe un plan en disco. Falla si la carpeta existe y no está vacía. */
export function writeProject(planResult, targetDir) {
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    throw new Error(`La carpeta "${targetDir}" ya existe y no está vacía.`);
  }
  for (const [rel, content] of planResult.files) {
    const dest = join(targetDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
  }
}
