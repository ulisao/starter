#!/usr/bin/env node
// Punto de entrada del binario `baretta`. Toda la lógica vive en src/index.js.
import { main } from '../src/index.js';

main(process.argv.slice(2)).catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
