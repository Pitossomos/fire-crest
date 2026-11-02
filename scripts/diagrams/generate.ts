/**
 * Gera todos os diagramas do projeto a partir do código-fonte atual.
 *
 *   npm run diagrams        → docs/diagrams/{classes,er,architecture}.md + index.html
 *   npm run diagrams:svg    → também exporta SVGs em docs/diagrams/svg/ (requer Chromium)
 *   npm run diagrams:check  → regenera e falha se algo mudou (usado na CI)
 *
 * A saída é determinística (ordenada, sem datas) para que o diff só mude
 * quando o código mudar.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Project } from 'ts-morph';
import { collectTypes, renderClassDiagram } from './class-diagram';
import { collectEntities, renderEntityTable, renderErDiagram } from './er-diagram';
import { collectDependencies, renderLayerDiagram, renderModuleDiagram } from './architecture';
import { GENERATED_HEADER, ROOT } from './util';

const OUT = join(ROOT, 'docs', 'diagrams');

interface Diagram {
  /** Nome do arquivo .mmd/.svg. */
  id: string;
  title: string;
  description: string;
  source: string;
}

function mdSection(d: Diagram): string {
  return [`## ${d.title}`, '', d.description, '', '```mermaid', d.source, '```', ''].join('\n');
}

function writeMarkdown(file: string, title: string, intro: string, diagrams: Diagram[], extra = ''): void {
  const body = [GENERATED_HEADER, '', `# ${title}`, '', intro, '', ...diagrams.map(mdSection), extra].join('\n');
  writeFileSync(join(OUT, file), `${body.trimEnd()}\n`);
}

function writeViewer(groups: { title: string; diagrams: Diagram[] }[]): void {
  const json = JSON.stringify(groups).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<!-- GERADO AUTOMATICAMENTE por scripts/diagrams/generate.ts — não edite à mão. -->
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fire Crest — Diagramas</title>
<style>
  :root { color-scheme: light dark; --bg:#fbf8f3; --fg:#1f1a24; --muted:#6b6070; --card:#ffffff; --line:#e3dbcf; --accent:#b4531f; }
  @media (prefers-color-scheme: dark) { :root { --bg:#14111a; --fg:#f2e6d0; --muted:#a89c88; --card:#1d1925; --line:#3a3242; --accent:#ffb347; } }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, sans-serif; background:var(--bg); color:var(--fg); }
  header { padding:16px; border-bottom:1px solid var(--line); display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  h1 { font-size:18px; margin:0 16px 0 0; color:var(--accent); }
  nav button { font:inherit; padding:6px 12px; border-radius:6px; border:1px solid var(--line); background:var(--card); color:var(--fg); cursor:pointer; }
  nav button[aria-pressed="true"] { border-color:var(--accent); color:var(--accent); font-weight:600; }
  main { padding:16px; }
  section { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px; margin-bottom:16px; overflow:auto; }
  section h2 { margin:0 0 4px; font-size:16px; }
  section p { margin:0 0 12px; color:var(--muted); font-size:14px; }
  .mermaid svg { height: auto; }
  .fit .mermaid svg { width: 100% !important; max-width: 100% !important; }
  .tools { float: right; }
  .tools button { font: inherit; font-size: 13px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); cursor: pointer; }
</style>
</head>
<body>
<header><h1>Fire Crest — Diagramas</h1><nav id="tabs"></nav></header>
<main id="content"></main>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@12.2.0/dist/mermaid.esm.min.mjs';
  const groups = ${json};
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'loose', maxTextSize: 500000 });
  const tabs = document.getElementById('tabs');
  const content = document.getElementById('content');
  async function show(i) {
    [...tabs.children].forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
    content.innerHTML = '';
    for (const d of groups[i].diagrams) {
      const s = document.createElement('section');
      s.innerHTML = '<div class="tools"><button>Ajustar à largura</button></div><h2></h2><p></p><div class="mermaid"></div>';
      const toggle = s.querySelector('.tools button');
      toggle.onclick = () => {
        const fit = s.classList.toggle('fit');
        toggle.textContent = fit ? 'Tamanho real' : 'Ajustar à largura';
      };
      s.querySelector('h2').textContent = d.title;
      s.querySelector('p').textContent = d.description;
      content.append(s);
      const { svg } = await mermaid.render('d_' + d.id, d.source);
      const holder = s.querySelector('.mermaid');
      holder.innerHTML = svg;
      // Tamanho real (largura do viewBox) com rolagem; o botão alterna para caber na largura.
      const el = holder.querySelector('svg');
      const vb = el.viewBox.baseVal;
      if (vb && vb.width) { el.style.width = vb.width + 'px'; el.style.maxWidth = 'none'; el.removeAttribute('width'); }
    }
  }
  groups.forEach((g, i) => {
    const b = document.createElement('button');
    b.textContent = g.title;
    b.onclick = () => show(i);
    tabs.append(b);
  });
  show(0);
</script>
</body>
</html>
`;
  writeFileSync(join(OUT, 'index.html'), html);
}

function exportSvgs(diagrams: Diagram[]): void {
  const svgDir = join(OUT, 'svg');
  rmSync(svgDir, { recursive: true, force: true });
  mkdirSync(svgDir, { recursive: true });
  const puppeteerConfig = join(svgDir, '.puppeteer.json');
  const chromium = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  writeFileSync(puppeteerConfig, JSON.stringify({
    ...(chromium ? { executablePath: chromium } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }));
  const mmdc = join(ROOT, 'node_modules', '.bin', 'mmdc');
  for (const d of diagrams) {
    const input = join(svgDir, `${d.id}.mmd`);
    writeFileSync(input, d.source);
    execFileSync(mmdc, ['-q', '-i', input, '-o', join(svgDir, `${d.id}.svg`), '-p', puppeteerConfig, '-b', 'white'], { stdio: 'inherit' });
    rmSync(input);
  }
  rmSync(puppeteerConfig);
  console.log(`SVGs exportados em ${svgDir}`);
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const project = new Project({ tsConfigFilePath: join(ROOT, 'tsconfig.json'), skipAddingFilesFromTsConfig: true });
  project.addSourceFilesAtPaths(join(ROOT, 'src/**/*.ts'));

  // --- Classes ---
  const types = collectTypes(project);
  const layers = [...new Set(types.map((t) => t.layer))].sort();
  const classDiagrams: Diagram[] = [
    {
      id: 'classes-overview',
      title: 'Visão geral',
      description: 'Todas as classes, interfaces e módulos de funções de `src/`, agrupados por camada, sem membros.',
      source: renderClassDiagram(types, { withMembers: false, title: 'Classes — visão geral' }),
    },
    ...layers.map((layer) => ({
      id: `classes-${layer}`,
      title: `Camada \`${layer}\``,
      description: `Atributos e métodos dos tipos em \`src/${layer === 'app' ? '' : `${layer}/`}\`. Relações apenas internas à camada.`,
      source: renderClassDiagram(types, { layers: [layer], withMembers: true, title: `Classes — ${layer}` }),
    })),
  ];
  writeMarkdown(
    'classes.md',
    'Diagrama de classes',
    'Extraído do AST TypeScript com ts-morph. Legenda: `<|--` herança, `<|..` implementação, `*--` composição (coleção), `-->` associação; `<<module>>` = arquivo que exporta funções; `$` = estático.',
    classDiagrams,
  );

  // --- ER ---
  const entities = collectEntities(project);
  const erDiagrams: Diagram[] = [{
    id: 'er',
    title: 'Entidades e relacionamentos',
    description: 'Interfaces marcadas com `@entity`. `Ref<X>` é chave estrangeira (FK) para X; listas e objetos embutidos são relações 1:N / 1:1.',
    source: renderErDiagram(entities),
  }];
  writeMarkdown(
    'er.md',
    'Diagrama Entidade-Relacionamento',
    'Modelo de dados do jogo (definições estáticas em `src/data/` e o save). Para incluir uma nova entidade, marque a interface com `/** @entity Descrição */`.',
    erDiagrams,
    `## Entidades\n\n${renderEntityTable(entities)}\n`,
  );

  // --- Arquitetura ---
  const deps = await collectDependencies();
  const archDiagrams: Diagram[] = [
    {
      id: 'architecture-layers',
      title: 'Camadas',
      description: 'Dependências entre camadas de `src/` e pacotes externos. Setas tracejadas = apenas `import type`. Regras em `.dependency-cruiser.cjs` (`npm run lint:arch`).',
      source: renderLayerDiagram(deps),
    },
    {
      id: 'architecture-modules',
      title: 'Módulos',
      description: 'Cada arquivo de `src/` e seus imports de valor (os `import type` estão resumidos na visão de camadas).',
      source: renderModuleDiagram(deps),
    },
  ];
  writeMarkdown(
    'architecture.md',
    'Arquitetura do software',
    'Gerado a partir dos imports reais com dependency-cruiser.',
    archDiagrams,
  );

  writeViewer([
    { title: 'Arquitetura', diagrams: archDiagrams },
    { title: 'Classes', diagrams: classDiagrams },
    { title: 'Entidade-Relacionamento', diagrams: erDiagrams },
  ]);

  console.log(`Diagramas gerados em ${OUT}: ${types.length} tipos, ${entities.length} entidades, ${deps.modules.length} módulos.`);
  if (process.argv.includes('--svg')) exportSvgs([...archDiagrams, ...classDiagrams, ...erDiagrams]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
