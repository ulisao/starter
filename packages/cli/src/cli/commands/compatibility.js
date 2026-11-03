// `baretta compatibility`: imprime el perfil activo y el estado de cada combinación.

import { loadProfile, loadCombinations } from '../../core/compatibility/index.js';

export async function compatibilityCommand() {
  const profile = loadProfile('stable');
  console.log(`Perfil: ${profile.name} v${profile.version} (Node ${profile.node}) — actualizado ${profile.updated}\n`);
  console.log('Combinaciones backend + auth:');
  for (const c of loadCombinations().sort((a, b) => (a.backend + a.auth).localeCompare(b.backend + b.auth))) {
    console.log(`  ${c.status.padEnd(12)} ${c.backend} + ${c.auth}${c.verifiedAt ? `  (verificada ${c.verifiedAt})` : ''}`);
  }
  console.log('\nPaquetes:');
  for (const e of Object.values(profile.packages).sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${e.status.padEnd(12)} ${e.name}@${e.version}`);
  }
}
