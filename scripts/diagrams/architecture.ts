/**
 * Gera os diagramas de arquitetura a partir dos imports reais (dependency-cruiser):
 *   1. Visão de camadas (diretórios de src/ + pacotes externos), com nº de imports.
 *   2. Grafo detalhado de módulos agrupado por camada.
 * Imports apenas de tipo (`import type`) aparecem tracejados.
 */
import { cruise, type ICruiseResult } from 'dependency-cruiser';
import { layerOf } from './util';

interface Edge {
  from: string;
  to: string;
  typeOnly: boolean;
}

export interface DependencyGraph {
  modules: string[];
  edges: Edge[];
  externals: string[];
}

const LAYER_ORDER = ['app', 'ui', 'scenes', 'render', 'core', 'data', 'save'];
const LAYER_LABEL: Record<string, string> = {
  app: 'main.ts — bootstrap do Phaser',
  scenes: 'scenes/ — cenas Phaser (controladores)',
  render: 'render/ — componentes visuais',
  core: 'core/ — regras do jogo (puro)',
  data: 'data/ — definições e conteúdo',
  save: 'save/ — persistência',
  ui: 'ui/ — controles de toque (DOM)',
};

function externalName(resolved: string): string {
  const m = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(resolved);
  return m ? m[1] : resolved;
}

export async function collectDependencies(): Promise<DependencyGraph> {
  const { output } = await cruise(['src'], {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
  });
  const result = output as ICruiseResult;
  const modules: string[] = [];
  const edges: Edge[] = [];
  const externals = new Set<string>();
  for (const m of result.modules) {
    if (!m.source.startsWith('src/')) continue;
    modules.push(m.source);
    for (const d of m.dependencies) {
      const typeOnly = d.dependencyTypes.includes('type-only');
      if (d.resolved.startsWith('src/')) {
        edges.push({ from: m.source, to: d.resolved, typeOnly });
      } else if (d.dependencyTypes.some((t) => t.startsWith('npm')) || d.resolved.includes('node_modules')) {
        const ext = externalName(d.resolved);
        externals.add(ext);
        edges.push({ from: m.source, to: `ext:${ext}`, typeOnly });
      }
    }
  }
  return { modules: modules.sort(), edges, externals: [...externals].sort() };
}

const nodeId = (s: string) => s.replace(/[^A-Za-z0-9]/g, '_');
const layerSort = (a: string, b: string) => {
  const ia = LAYER_ORDER.indexOf(a);
  const ib = LAYER_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
};
const layerOfNode = (n: string) => (n.startsWith('ext:') ? n : layerOf(n));

/** Visão de alto nível: camadas e quantos imports cruzam cada fronteira. */
export function renderLayerDiagram(g: DependencyGraph): string {
  const layers = [...new Set(g.modules.map(layerOf))].sort(layerSort);
  const counts = new Map<string, { value: number; type: number }>();
  for (const e of g.edges) {
    const from = layerOfNode(e.from);
    const to = layerOfNode(e.to);
    if (from === to) continue;
    const key = `${from}|${to}`;
    const c = counts.get(key) ?? { value: 0, type: 0 };
    if (e.typeOnly) c.type++;
    else c.value++;
    counts.set(key, c);
  }
  const lines = ['---', 'title: Arquitetura — camadas', '---', 'flowchart TB'];
  for (const l of layers) {
    const n = g.modules.filter((m) => layerOf(m) === l).length;
    lines.push(`  ${nodeId(l)}["<b>${LAYER_LABEL[l] ?? l}</b><br/>${n} módulo(s)"]:::layer_${nodeId(l)}`);
  }
  for (const ext of g.externals) lines.push(`  ${nodeId(`ext:${ext}`)}[("${ext}")]:::external`);
  for (const [key, c] of [...counts.entries()].sort()) {
    const [from, to] = key.split('|');
    const parts = [c.value ? `${c.value} import(s)` : '', c.type ? `${c.type} só tipos` : ''].filter(Boolean).join(', ');
    const arrow = c.value ? '-->' : '-.->';
    lines.push(`  ${nodeId(from)} ${arrow}|"${parts}"| ${nodeId(to)}`);
  }
  lines.push(
    '  classDef external fill:#e9e2cc,stroke:#5c4630,color:#1f1a24',
    '  classDef layer_app fill:#f3dcc0,stroke:#8a4a2a,color:#1f1a24',
    '  classDef layer_scenes fill:#f6c9c4,stroke:#7a2420,color:#1f1a24',
    '  classDef layer_render fill:#f7d8b5,stroke:#b4531f,color:#1f1a24',
    '  classDef layer_core fill:#c9d8f6,stroke:#24418a,color:#1f1a24',
    '  classDef layer_data fill:#c8ecd2,stroke:#226b37,color:#1f1a24',
    '  classDef layer_save fill:#ddd2f2,stroke:#4b3a6b,color:#1f1a24',
    '  classDef layer_ui fill:#f6e7a8,stroke:#8a6a1a,color:#1f1a24',
  );
  return lines.join('\n');
}

/**
 * Grafo de módulos (arquivos) agrupados por camada. Mostra só imports de valor:
 * os `import type` (quase todos para data/types.ts) poluiriam o grafo e já
 * aparecem resumidos na visão de camadas.
 */
export function renderModuleDiagram(g: DependencyGraph): string {
  const lines = ['---', 'title: Arquitetura — dependências entre módulos', '---', 'flowchart TB'];
  const layers = [...new Set(g.modules.map(layerOf))].sort(layerSort);
  for (const l of layers) {
    lines.push(`  subgraph ${nodeId(`layer_${l}`)}["${l === 'app' ? 'src' : `src/${l}`}"]`);
    for (const m of g.modules.filter((x) => layerOf(x) === l)) {
      const label = m.slice(l === 'app' ? 'src/'.length : `src/${l}/`.length);
      lines.push(`    ${nodeId(m)}["${label}"]`);
    }
    lines.push('  end');
  }
  for (const ext of g.externals) lines.push(`  ${nodeId(`ext:${ext}`)}[("${ext}")]:::external`);
  const seen = new Set<string>();
  for (const e of [...g.edges].filter((x) => !x.typeOnly).sort((a, b) => `${a.from}${a.to}`.localeCompare(`${b.from}${b.to}`))) {
    const key = `${e.from}|${e.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`  ${nodeId(e.from)} --> ${nodeId(e.to)}`);
  }
  lines.push('  classDef external fill:#e9e2cc,stroke:#5c4630,color:#1f1a24');
  return lines.join('\n');
}
