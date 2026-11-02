/**
 * Regras de arquitetura do Fire Crest (verificadas por `npm run lint:arch` e na CI).
 * Camadas: main → scenes → render → core → data
 *   - core/ e data/ são lógica/dados puros: nunca importam Phaser nem camadas visuais.
 *   - data/ não depende de core/.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Dependências circulares dificultam testes e entendimento.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-is-pure',
      severity: 'error',
      comment: 'core/ é lógica pura e testável: não pode importar Phaser, render/ nem scenes/.',
      from: { path: '^src/core/' },
      to: { path: ['^src/render/', '^src/scenes/', 'node_modules/phaser'] },
    },
    {
      name: 'data-is-pure',
      severity: 'error',
      comment: 'data/ contém apenas definições: não depende de core/, render/, scenes/ nem Phaser.',
      from: { path: '^src/data/' },
      to: { path: ['^src/core/', '^src/render/', '^src/scenes/', 'node_modules/phaser'] },
    },
    {
      name: 'render-not-scenes',
      severity: 'error',
      comment: 'render/ são componentes visuais reutilizáveis; não conhecem as cenas.',
      from: { path: '^src/render/' },
      to: { path: '^src/scenes/' },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Módulo que ninguém importa (código morto?).',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', '^src/main\\.ts$'] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    exclude: { path: '^(tests|scripts)/' },
  },
};
