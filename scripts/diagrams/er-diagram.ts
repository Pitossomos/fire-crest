/**
 * Gera o diagrama Entidade-Relacionamento (Mermaid `erDiagram`) a partir das
 * interfaces marcadas com a tag JSDoc `@entity` em `src/`.
 *
 * Relações inferidas pelo tipo do campo:
 *   Ref<X>             → N:1  (chave estrangeira)
 *   Ref<X>[]           → N:N  (lista de chaves)
 *   Record<k, Ref<X>>  → N:N  (mapa de chaves)
 *   X[]                → 1:N  (coleção embutida)
 *   X                  → 1:1  (objeto embutido)
 */
import type { InterfaceDeclaration, Project } from 'ts-morph';
import { relPath } from './util';

/** Palavras reservadas do Mermaid que quebram o lexer se usadas como nome de atributo. */
const RESERVED = new Set(['title', 'accTitle', 'accDescr', 'direction', 'style', 'classDef', 'class']);

/** Id seguro para a entidade (o lexer é case-insensitive: `ClassDef` colide com `classDef`). */
function entityId(name: string): string {
  return [...RESERVED].some((r) => r.toLowerCase() === name.toLowerCase()) ? `${name}_` : name;
}

interface Entity {
  name: string;
  description: string;
  file: string;
  attributes: string[];
  relations: string[];
}

function entityTag(i: InterfaceDeclaration): { is: boolean; description: string } {
  for (const doc of i.getJsDocs()) {
    for (const tag of doc.getTags()) {
      if (tag.getTagName() === 'entity') {
        return { is: true, description: (tag.getCommentText() ?? '').trim() };
      }
    }
  }
  return { is: false, description: '' };
}

/** Converte o tipo TS para um tipo "palavra" aceito pelo erDiagram. */
function attrType(text: string): string {
  const t = text.replace(/\s+/g, '');
  if (/^Ref<\w+>$/.test(t)) return 'string';
  if (/\[\]$/.test(t)) return 'list';
  if (/^Record</.test(t)) return 'map';
  if (/\|null$/.test(t)) return t.replace(/\|null$/, '');
  return /^[A-Za-z_]\w*$/.test(t) ? t : 'object';
}

export function collectEntities(project: Project): Entity[] {
  const entities: { decl: InterfaceDeclaration; description: string }[] = [];
  for (const sf of project.getSourceFiles()) {
    if (!relPath(sf.getFilePath()).startsWith('src/')) continue;
    for (const i of sf.getInterfaces()) {
      const tag = entityTag(i);
      if (tag.is) entities.push({ decl: i, description: tag.description });
    }
  }
  const names = new Set(entities.map((e) => e.decl.getName()));

  return entities
    .map(({ decl, description }) => {
      const name = decl.getName();
      const attributes: string[] = [];
      const relations: string[] = [];
      for (const p of decl.getProperties()) {
        const field = p.getName();
        const text = (p.getTypeNode()?.getText() ?? 'unknown').replace(/\s+/g, ' ');
        const optional = p.hasQuestionToken();
        const ref = /Ref<(\w+)>/.exec(text);
        const isKey = field === 'id';
        const isFk = ref !== null;
        const keys = [isKey ? 'PK' : '', isFk ? 'FK' : ''].filter(Boolean).join(', ');
        const comments: string[] = [];
        if (ref) comments.push(`-> ${ref[1]}`);
        if (optional) comments.push('opcional');
        const attrName = RESERVED.has(field) ? `${field}_` : field;
        if (attrName !== field) comments.push(`campo ${field}`);
        if (!ref && attrType(text) !== text.replace(/\s+/g, '')) comments.push(text.replace(/"/g, "'"));
        const comment = comments.length ? ` "${comments.join('; ').replace(/"/g, "'")}"` : '';
        attributes.push(`    ${attrType(text)} ${attrName}${keys ? ` ${keys}` : ''}${comment}`);

        if (ref && names.has(ref[1])) {
          const target = ref[1];
          const many = /\[\]$/.test(text.trim()) || /^Record</.test(text.trim());
          const card = many ? '}o--o{' : optional ? '}o--o|' : '}o--||';
          relations.push(`  ${entityId(name)} ${card} ${entityId(target)} : "${field}"`);
          continue;
        }
        const embedded = /^(\w+)(\[\])?$/.exec(text.trim());
        if (embedded && names.has(embedded[1])) {
          const card = embedded[2] ? '||--o{' : optional ? '||--o|' : '||--||';
          relations.push(`  ${entityId(name)} ${card} ${entityId(embedded[1])} : "${field}"`);
        }
      }
      return { name, description, file: relPath(decl.getSourceFile().getFilePath()), attributes, relations };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function renderErDiagram(entities: Entity[]): string {
  const lines = ['---', 'title: Modelo de dados (entidades @entity)', '---', 'erDiagram'];
  for (const e of entities) {
    const id = entityId(e.name);
    const header = id === e.name ? id : `${id}["${e.name}"]`;
    lines.push(`  ${header} {`, ...e.attributes, '  }');
  }
  lines.push(...entities.flatMap((e) => e.relations).sort());
  return lines.join('\n');
}

export function renderEntityTable(entities: Entity[]): string {
  const rows = entities.map((e) => `| \`${e.name}\` | ${e.description || '—'} | \`${e.file}\` |`);
  return ['| Entidade | Descrição | Arquivo |', '|---|---|---|', ...rows].join('\n');
}
