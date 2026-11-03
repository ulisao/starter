// Motor de plantillas mínimo.
//
// Se eligió una sintaxis propia (en vez de {{ }}) porque {{ }} aparece en JSX
// (style={{ ... }}) y en GitHub Actions (${{ ... }}); chocaría con el código generado.
//
//   <%= variable %>          interpola una variable (falla si no existe)
//   <%#if flag%>             abre un bloque condicional (en una línea propia)
//   <%#if !flag%>            condicional negado
//   <%#else%>                rama alternativa
//   <%#endif%>               cierra el bloque
//
// Las líneas con directivas se eliminan del resultado. Los bloques se pueden anidar.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIRECTIVE = /^\s*<%#(if|else|endif)\s*(!?)([A-Za-z0-9_]*)\s*%>\s*$/;
const VARIABLE = /<%=\s*([A-Za-z0-9_]+)\s*%>/g;

export function render(source, ctx, label = 'plantilla') {
  const out = [];
  // Cada nivel: { parent: ¿el bloque padre está activo?, cond: valor de la condición }
  const stack = [{ parent: true, cond: true, inElse: false }];
  const active = () => {
    const top = stack[stack.length - 1];
    return top.parent && (top.inElse ? !top.cond : top.cond);
  };

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  lines.forEach((line, i) => {
    const m = line.match(DIRECTIVE);
    if (m) {
      const [, kind, neg, flag] = m;
      if (kind === 'if') {
        if (!(flag in ctx)) throw new Error(`${label}:${i + 1}: flag desconocido "${flag}"`);
        stack.push({ parent: active(), cond: neg ? !ctx[flag] : !!ctx[flag], inElse: false });
      } else if (kind === 'else') {
        if (stack.length < 2) throw new Error(`${label}:${i + 1}: #else sin #if`);
        stack[stack.length - 1].inElse = true;
      } else {
        if (stack.length < 2) throw new Error(`${label}:${i + 1}: #endif sin #if`);
        stack.pop();
      }
      return;
    }
    if (!active()) return;
    out.push(
      line.replace(VARIABLE, (_, name) => {
        if (!(name in ctx)) throw new Error(`${label}:${i + 1}: variable desconocida "${name}"`);
        return String(ctx[name]);
      }),
    );
  });
  if (stack.length !== 1) throw new Error(`${label}: bloque #if sin cerrar`);
  return out.join('\n');
}

// Convención de nombres dentro de templates/: un segmento que empieza con "dot-"
// se convierte en ".". Es necesario porque npm no publica archivos .gitignore
// y porque así las plantillas no activan configuración real dentro del repo.
export const mapSegment = (seg) => (seg.startsWith('dot-') ? `.${seg.slice(4)}` : seg);

/** Lista recursivamente los archivos de una carpeta de plantillas: [{ rel, abs }]. */
export function walk(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) files.push(...walk(abs, base));
    else if (entry !== '.gitkeep') {
      const rel = abs
        .slice(base.length + 1)
        .split(/[\\/]/)
        .map(mapSegment)
        .join('/');
      files.push({ rel, abs });
    }
  }
  return files;
}

export const readTemplate = (abs) => readFileSync(abs, 'utf8');
