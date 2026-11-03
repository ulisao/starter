// Extra: integración continua con GitHub Actions.

export default {
  id: 'extra-github-actions',
  when: (cfg) => cfg.extras.includes('github-actions'),
  templates: 'extras/github-actions',
  summary: 'GitHub Actions: CI con typecheck, lint, tests y build. Doc: `docs/extras/github-actions.md`.',
  stack: ['GitHub Actions (CI en `.github/workflows/ci.yml`)'],
  notes: ['GitHub Actions: el flujo `.github/workflows/ci.yml` requiere el lockfile versionado. Ver `docs/extras/github-actions.md`.'],
};
