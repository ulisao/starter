// Enrutador de comandos de la CLI.
//
// Hoy existen `create`, `compatibility` y `doctor`. Para agregar `update`,
// creá src/cli/commands/<nombre>.js y registralo en COMMANDS (ver docs/DEVELOPMENT.md).

import { readFileSync } from 'node:fs';
import { createCommand, CREATE_HELP } from './cli/commands/create.js';
import { compatibilityCommand } from './cli/commands/compatibility.js';
import { doctorCommand, DOCTOR_HELP } from './cli/commands/doctor.js';
import { updateCommand, UPDATE_HELP } from './cli/commands/update.js';

const COMMANDS = { create: createCommand, compatibility: compatibilityCommand, doctor: doctorCommand, update: updateCommand };

const HELP = `
Baretta Starter — generador de proyectos Next.js de Estudio Baretta

Uso: baretta <comando> [opciones]

Comandos:
  create          Crea un proyecto nuevo (asistente interactivo)
  compatibility   Muestra el perfil de compatibilidad y el estado de cada combinación
  doctor          Diagnostica un proyecto generado contra el registro de compatibilidad
  update          Actualiza las versiones de un proyecto generado al perfil de compatibilidad

Opciones:
  -v, --version   Versión del CLI
  -h, --help      Ayuda
${CREATE_HELP}${DOCTOR_HELP}${UPDATE_HELP}`;

export async function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') return console.log(HELP);
  if (cmd === '-v' || cmd === '--version') {
    return console.log(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
  }
  const run = COMMANDS[cmd];
  if (!run) {
    console.error(`Comando desconocido: "${cmd}".\n${HELP}`);
    process.exitCode = 1;
    return;
  }
  await run(rest);
}
