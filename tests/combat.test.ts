import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { forecast, resolveCombat, strikeStats, weaponTriangle } from '../src/core/combat';
import { combatExp, gainExp, MAX_LEVEL } from '../src/core/leveling';
import { Rng } from '../src/core/rng';
import { DB } from '../src/data';
import { makeStage } from './helpers';

/** Rng que sempre acerta (roll → true) ou sempre erra. */
class FixedRng extends Rng {
  constructor(private readonly result: boolean) {
    super(1);
  }
  override roll(): boolean {
    return this.result;
  }
}

function duel(rows: string[], a: Parameters<typeof makeStage>[1][0], d: Parameters<typeof makeStage>[1][0]) {
  const s = new BattleState(makeStage(rows, [a, d]), DB, { seed: 42 });
  return { s, a: s.units[0], d: s.units[1] };
}

describe('triângulo de armas', () => {
  it('espada > machado > lança > espada', () => {
    expect(weaponTriangle('sword', 'axe')).toBe(1);
    expect(weaponTriangle('axe', 'lance')).toBe(1);
    expect(weaponTriangle('lance', 'sword')).toBe(1);
    expect(weaponTriangle('axe', 'sword')).toBe(-1);
    expect(weaponTriangle('bow', 'sword')).toBe(0);
  });
});

describe('fórmulas', () => {
  it('dano físico = FOR + poder (+triângulo) − DEF − terreno', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    // Aren: FOR 6 + Espada 5 + 1 (vantagem) − DEF 3 = 9
    expect(strikeStats(a, d, s.map.terrainAt(d.position)).damage).toBe(9);
    // Bandido: FOR 5 + Machado 7 − 1 (desvantagem) − DEF 6 = 5
    expect(strikeStats(d, a, s.map.terrainAt(a.position)).damage).toBe(5);
  });

  it('floresta reduz dano e acerto do atacante', () => {
    const plain = duel(['..'],
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    const forest = duel(['.f'],
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    const p = forecast(plain.s.map, plain.a, plain.d).attackerStats;
    const f = forecast(forest.s.map, forest.a, forest.d).attackerStats;
    expect(f.damage).toBe(p.damage - 1);
    // Acerto bruto na planície passa de 100 e é limitado; na floresta cai 20 do bruto.
    expect(f.hit).toBeLessThan(p.hit);
    expect(p.hit - f.hit).toBeLessThanOrEqual(20);
  });

  it('magia usa MAG contra RES', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'corvin', faction: 'player', x: 0, y: 0 },
      { characterId: 'hadric', faction: 'enemy', x: 1, y: 0 });
    // Corvin MAG 8 + Chamas 5 − RES 2 = 11 (DEF alta de Hadric não importa)
    expect(strikeStats(a, d, s.map.terrainAt(d.position)).damage).toBe(11);
  });

  it('acerto e crítico ficam entre 0 e 100', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'seraphine', faction: 'enemy', x: 0, y: 0 },
      { characterId: 'aren', faction: 'player', x: 1, y: 0 });
    const st = strikeStats(a, d, s.map.terrainAt(d.position));
    expect(st.hit).toBeLessThanOrEqual(100);
    expect(st.crit).toBeGreaterThanOrEqual(0);
  });
});

describe('previsão', () => {
  it('ataque duplo com VEL +4', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'mira', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    const f = forecast(s.map, a, d);
    expect(f.attackerStats.strikes).toBe(2); // VEL 11 vs 4
    expect(f.defenderStats.strikes).toBe(1);
  });

  it('arqueiro adjacente não ataca; alvo adjacente ao arqueiro contra-ataca de longe? não', () => {
    const adj = duel(['..'],
      { characterId: 'wren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    expect(forecast(adj.s.map, adj.a, adj.d).attackerStats.strikes).toBe(0);
    const far = duel(['...'],
      { characterId: 'wren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 2, y: 0 });
    const f = forecast(far.s.map, far.a, far.d);
    expect(f.attackerStats.strikes).toBeGreaterThan(0);
    expect(f.defenderStats.strikes).toBe(0);
  });

  it('cajado não ataca', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'lys', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    expect(forecast(s.map, a, d).attackerStats.strikes).toBe(0);
    expect(s.targetsInRange(a)).toHaveLength(0);
  });
});

describe('resolução', () => {
  it('ordem A → D → A (dobro) e para quando alguém cai', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'mira', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    d.hp = 1;
    const r = resolveCombat(s.map, a, d, new FixedRng(true));
    expect(r.strikes).toHaveLength(1);
    expect(r.defenderDied).toBe(true);
    expect(d.hp).toBe(0);
  });

  it('com todos os golpes errando, ninguém sofre dano', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'mira', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    const r = resolveCombat(s.map, a, d, new FixedRng(false));
    expect(r.strikes.map((x) => x.attackerId)).toEqual([a.id, d.id, a.id]);
    expect(a.hp).toBe(a.maxHp);
    expect(d.hp).toBe(d.maxHp);
  });

  it('crítico triplica o dano', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'hadric', faction: 'player', x: 0, y: 0 },
      { characterId: 'grull', faction: 'enemy', x: 1, y: 0 });
    const base = forecast(s.map, a, d).attackerStats.damage;
    const r = resolveCombat(s.map, a, d, new FixedRng(true));
    expect(r.strikes[0].crit).toBe(true);
    expect(r.strikes[0].damage).toBe(base * 3);
  });

  it('BattleState.attack dá EXP apenas ao jogador e marca o atacante', () => {
    const { s, a, d } = duel(['..'],
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 });
    const out = s.attack(a, d);
    expect(a.hasActed).toBe(true);
    expect(out.exp.every((e) => e.unit.faction === 'player')).toBe(true);
    expect(() => s.attack(d, d)).toThrow();
  });
});

describe('EXP e níveis', () => {
  it('abater dá mais EXP que só ferir; chefe dá bônus', () => {
    const s = new BattleState(makeStage(['...'], [
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 },
      { characterId: 'grull', faction: 'enemy', x: 2, y: 0, boss: true },
    ]), DB);
    const [aren, bandit, grull] = s.units;
    expect(combatExp(aren, bandit, true, true)).toBeGreaterThan(combatExp(aren, bandit, true, false));
    expect(combatExp(aren, bandit, false, false)).toBe(1);
    expect(combatExp(aren, grull, true, true)).toBeGreaterThan(combatExp(aren, bandit, true, true) + 30);
  });

  it('sobe de nível a cada 100 EXP e rola as taxas', () => {
    const s = new BattleState(makeStage(['.'], [{ characterId: 'aren', faction: 'player', x: 0, y: 0 }]), DB);
    const aren = s.units[0];
    const ups = gainExp(aren, 250, new FixedRng(true));
    expect(ups.map((u) => u.level)).toEqual([2, 3]);
    expect(aren.exp).toBe(50);
    expect(aren.stats.str).toBe(DB.characters.aren.stats.str + 2);
    expect(aren.hp).toBe(aren.maxHp);
  });

  it(`para no nível ${MAX_LEVEL}`, () => {
    const s = new BattleState(makeStage(['.'], [{ characterId: 'aren', faction: 'player', x: 0, y: 0 }]), DB);
    const aren = s.units[0];
    gainExp(aren, 5000, new FixedRng(false));
    expect(aren.level).toBe(MAX_LEVEL);
    expect(aren.exp).toBe(0);
  });

  it('seed fixa → resultado reproduzível', () => {
    const run = () => {
      const s = new BattleState(makeStage(['..'], [
        { characterId: 'aren', faction: 'player', x: 0, y: 0 },
        { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 },
      ]), DB, { seed: 7 });
      return s.attack(s.units[0], s.units[1]).result.strikes;
    };
    expect(run()).toEqual(run());
  });
});
