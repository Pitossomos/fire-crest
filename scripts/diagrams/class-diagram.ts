/**
 * Gera diagramas de classes Mermaid a partir do AST TypeScript (ts-morph).
 *
 * - Classes, interfaces e enums de `src/` viram classes do diagrama.
 * - Módulos que só exportam funções viram uma classe `<<module>>` com as funções.
 * - Relações: herança (<|--), implementação (..|>), composição (*--) para
 *   coleções e associação (-->) para referências simples.
 */
import {
  type ClassDeclaration,
  type EnumDeclaration,
  type InterfaceDeclaration,
  Node,
  type Project,
  Scope,
  type SourceFile,
  type Type,
} from 'ts-morph';
import { escapeLabel, layerOf, relPath, sanitizeType } from './util';

interface TypeInfo {
  id: string;
  label: string;
  layer: string;
  stereotype?: string;
  members: string[];
  /** Nomes de tipos referenciados por campos, com indicação de coleção. */
  refs: { target: string; field: string; many: boolean }[];
  extends: string[];
  implements: string[];
}

const COLLECTION_RE = /\[\]|^(Map|Set|Record|ReadonlyArray|Array)</;

function visibility(node: Node): string {
  if (Node.isScoped(node)) {
    const scope = node.getScope();
    if (scope === Scope.Private) return '-';
    if (scope === Scope.Protected) return '#';
  }
  return '+';
}

function typeText(node: Node & { getType(): Type }): string {
  // Preferir o texto escrito no código (mais legível que o tipo inferido).
  const typeNode = (node as unknown as { getTypeNode?: () => Node | undefined }).getTypeNode?.();
  if (typeNode) return typeNode.getText();
  if (Node.isGetAccessorDeclaration(node)) {
    const rt = node.getReturnTypeNode();
    if (rt) return rt.getText();
  }
  return node.getType().getText(node);
}

function methodSignature(name: string, params: { getName(): string; getTypeNode(): Node | undefined }[], ret: string, prefix: string, isStatic: boolean): string {
  const ps = params.map((p) => `${p.getName()}: ${sanitizeType(p.getTypeNode()?.getText() ?? 'any')}`).join(', ');
  return `${prefix}${name}(${ps}) ${sanitizeType(ret)}${isStatic ? '$' : ''}`;
}

function collectRefs(text: string, field: string, known: Set<string>, out: TypeInfo['refs']): void {
  const names = new Set(text.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []);
  for (const n of names) {
    if (known.has(n)) out.push({ target: n, field, many: COLLECTION_RE.test(text.trim()) });
  }
}

function fromClass(c: ClassDeclaration, layer: string, known: Set<string>): TypeInfo {
  const name = c.getName() ?? 'Anonymous';
  const info: TypeInfo = { id: name, label: name, layer, members: [], refs: [], extends: [], implements: [] };
  if (c.isAbstract()) info.stereotype = 'abstract';
  const ext = c.getExtends();
  if (ext) info.extends.push(ext.getExpression().getText());
  for (const i of c.getImplements()) info.implements.push(i.getExpression().getText());

  for (const p of c.getProperties()) {
    const t = typeText(p);
    info.members.push(`${visibility(p)}${p.getName()}: ${sanitizeType(t)}${p.isStatic() ? '$' : ''}`);
    collectRefs(t, p.getName(), known, info.refs);
  }
  for (const ctor of c.getConstructors()) {
    for (const param of ctor.getParameters()) {
      if (!param.isParameterProperty()) continue;
      const t = param.getTypeNode()?.getText() ?? 'any';
      info.members.push(`${visibility(param)}${param.getName()}: ${sanitizeType(t)}`);
      collectRefs(t, param.getName(), known, info.refs);
    }
  }
  for (const g of c.getGetAccessors()) {
    const t = typeText(g);
    info.members.push(`${visibility(g)}${g.getName()}: ${sanitizeType(t)}`);
  }
  for (const m of c.getMethods()) {
    if (visibility(m) === '-' && m.getName().startsWith('#')) continue;
    const ret = m.getReturnTypeNode()?.getText() ?? m.getReturnType().getText(m);
    info.members.push(methodSignature(m.getName(), m.getParameters(), ret, visibility(m), m.isStatic()));
  }
  return info;
}

function fromInterface(i: InterfaceDeclaration, layer: string, known: Set<string>): TypeInfo {
  const name = i.getName();
  const info: TypeInfo = { id: name, label: name, layer, stereotype: 'interface', members: [], refs: [], extends: [], implements: [] };
  for (const e of i.getExtends()) info.extends.push(e.getExpression().getText());
  for (const p of i.getProperties()) {
    const t = p.getTypeNode()?.getText() ?? p.getType().getText(p);
    info.members.push(`+${p.getName()}${p.hasQuestionToken() ? '?' : ''}: ${sanitizeType(t)}`);
    collectRefs(t, p.getName(), known, info.refs);
  }
  for (const m of i.getMethods()) {
    const ret = m.getReturnTypeNode()?.getText() ?? 'void';
    info.members.push(methodSignature(m.getName(), m.getParameters(), ret, '+', false));
  }
  return info;
}

function fromEnum(e: EnumDeclaration, layer: string): TypeInfo {
  const name = e.getName();
  return {
    id: name, label: name, layer, stereotype: 'enumeration',
    members: e.getMembers().map((m) => m.getName()), refs: [], extends: [], implements: [],
  };
}

/** Módulo com funções exportadas (sem classe) vira uma pseudo-classe <<module>>. */
function fromModule(sf: SourceFile, layer: string): TypeInfo | undefined {
  const fns = sf.getFunctions().filter((f) => f.isExported());
  if (fns.length === 0) return undefined;
  const file = relPath(sf.getFilePath());
  const base = file.replace(/^src\//, '').replace(/\.ts$/, '');
  return {
    id: `mod_${base.replace(/[^A-Za-z0-9]/g, '_')}`,
    label: `${base.split('/').pop()}.ts`,
    layer,
    stereotype: 'module',
    members: fns.map((f) => {
      const ret = f.getReturnTypeNode()?.getText() ?? f.getReturnType().getText(f);
      return methodSignature(f.getName() ?? 'default', f.getParameters(), ret, '+', false);
    }),
    refs: [],
    extends: [],
    implements: [],
  };
}

export function collectTypes(project: Project): TypeInfo[] {
  const files = project.getSourceFiles().filter((sf) => relPath(sf.getFilePath()).startsWith('src/'));
  const known = new Set<string>();
  for (const sf of files) {
    for (const c of sf.getClasses()) if (c.getName()) known.add(c.getName()!);
    for (const i of sf.getInterfaces()) known.add(i.getName());
    for (const e of sf.getEnums()) known.add(e.getName());
  }
  const out: TypeInfo[] = [];
  for (const sf of files.sort((a, b) => relPath(a.getFilePath()).localeCompare(relPath(b.getFilePath())))) {
    const layer = layerOf(relPath(sf.getFilePath()));
    for (const c of sf.getClasses()) out.push(fromClass(c, layer, known));
    for (const i of sf.getInterfaces()) out.push(fromInterface(i, layer, known));
    for (const e of sf.getEnums()) out.push(fromEnum(e, layer));
    const mod = fromModule(sf, layer);
    if (mod) out.push(mod);
  }
  return out;
}

function externalId(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, '_');
}

/**
 * Monta um `classDiagram` Mermaid.
 * @param layers camadas incluídas (vazio = todas)
 * @param withMembers inclui atributos e métodos
 */
export function renderClassDiagram(types: TypeInfo[], opts: { layers?: string[]; withMembers: boolean; title: string }): string {
  const included = types.filter((t) => !opts.layers || opts.layers.includes(t.layer));
  const ids = new Set(included.map((t) => t.id));
  const allIds = new Set(types.map((t) => t.id));
  const lines: string[] = ['---', `title: ${opts.title}`, '---', 'classDiagram', '  direction LR'];
  const externals = new Map<string, string>();

  const byLayer = new Map<string, TypeInfo[]>();
  for (const t of included) byLayer.set(t.layer, [...(byLayer.get(t.layer) ?? []), t]);

  for (const [layer, list] of [...byLayer.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  namespace ${layer.replace(/[^A-Za-z0-9_]/g, '_')} {`);
    for (const t of list) {
      const header = t.label === t.id ? `class ${t.id}` : `class ${t.id}["${escapeLabel(t.label)}"]`;
      if (opts.withMembers && t.members.length > 0) {
        lines.push(`    ${header} {`);
        if (t.stereotype) lines.push(`      <<${t.stereotype}>>`);
        for (const m of t.members) lines.push(`      ${m}`);
        lines.push('    }');
      } else if (t.stereotype) {
        lines.push(`    ${header} {`, `      <<${t.stereotype}>>`, '    }');
      } else {
        lines.push(`    ${header}`);
      }
    }
    lines.push('  }');
  }

  const rels = new Set<string>();
  const nodeFor = (name: string): string => {
    if (allIds.has(name)) return name;
    const id = externalId(name);
    externals.set(id, name);
    return id;
  };
  for (const t of included) {
    for (const e of t.extends) rels.add(`  ${nodeFor(e)} <|-- ${t.id}`);
    for (const i of t.implements) rels.add(`  ${nodeFor(i)} <|.. ${t.id}`);
    const seen = new Set<string>();
    for (const r of t.refs) {
      if (r.target === t.id) continue;
      if (!ids.has(r.target) && opts.layers) continue; // em diagramas por camada, só relações internas
      const key = `${r.target}:${r.field}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rels.add(r.many
        ? `  ${t.id} "1" *-- "*" ${r.target} : ${r.field}`
        : `  ${t.id} --> ${r.target} : ${r.field}`);
    }
  }
  for (const [id, name] of [...externals.entries()].sort()) {
    lines.push(`  class ${id}["${escapeLabel(name)}"] {`, '    <<external>>', '  }');
  }
  lines.push(...[...rels].sort());
  return lines.join('\n');
}
