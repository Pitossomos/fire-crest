import { relative, sep } from 'node:path';

export const ROOT = process.cwd();

/** Caminho relativo à raiz do repositório, sempre com '/'. */
export function relPath(abs: string): string {
  return relative(ROOT, abs).split(sep).join('/');
}

/** Camada arquitetural de um arquivo de `src/` (primeiro diretório). */
export function layerOf(file: string): string {
  const m = /^src\/([^/]+)\//.exec(file);
  return m ? m[1] : 'app';
}

/** Escapa texto para rótulos entre aspas no Mermaid. */
export function escapeLabel(s: string): string {
  return s.replace(/"/g, '#quot;');
}

/**
 * Simplifica um tipo TypeScript para caber num membro de classDiagram:
 * remove `import("…").`, troca objetos literais por `object`, funções por
 * `Function`, genéricos `<>` por `~~` e limita o tamanho.
 */
export function sanitizeType(raw: string): string {
  let t = raw.replace(/import\("[^"]*"\)\./g, '').replace(/\s+/g, ' ').trim();
  if (t.includes('=>')) return 'Function';
  let prev: string;
  do {
    prev = t;
    t = t.replace(/\{[^{}]*\}/g, 'object');
  } while (t !== prev);
  t = t.replace(/[<>]/g, '~').replace(/;/g, ',').replace(/'/g, '');
  return t.length > 60 ? `${t.slice(0, 57)}...` : t;
}

export const GENERATED_HEADER =
  '<!-- GERADO AUTOMATICAMENTE por scripts/diagrams/generate.ts — não edite à mão. Rode `npm run diagrams`. -->';
