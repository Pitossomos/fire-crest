import Phaser from 'phaser';
import { DB, lookup } from '../data';
import { type AttackOutcome, BattleState, type RangeInfo } from '../core/battle-state';
import { type Point, pointKey, samePoint } from '../core/grid';
import { buildPath } from '../core/pathfinding';
import type { Unit } from '../core/unit';
import { MapView } from '../render/MapView';
import { UnitSprite } from '../render/UnitSprite';
import { SidePanel } from '../render/SidePanel';
import { ActionMenu, type MenuOption } from '../render/ActionMenu';
import { showPhaseBanner } from '../render/PhaseBanner';
import { ForecastPanel } from '../render/ForecastPanel';
import { floatText, levelUpPopup, outcomeBanner } from '../render/effects';
import { actionOrder, planAction } from '../core/ai';
import { evaluate } from '../core/objectives';
import { type EventEffects, EventEngine } from '../core/events';
import { runDialogue } from './DialogueScene';
import type { ResultData } from './ResultScene';
import { applyVictory, buildStageUnits, currentStageId, devSaveForStage } from '../core/campaign';
import type { SaveData } from '../data/types';
import { writeSave } from '../save/save';
import { playSfx, toggleMute } from '../render/sfx';
import { forecast } from '../core/combat';
import { MAP_AREA, TILE } from '../render/layout';

/** Modos de interação do jogador. */
type Mode = 'idle' | 'selected' | 'moving' | 'menu' | 'inspect' | 'targeting' | 'busy';

interface Targeting {
  kind: 'attack' | 'heal';
  sel: Selection;
  targets: Unit[];
  index: number;
}

interface Selection {
  unit: Unit;
  origin: Point;
  range: RangeInfo;
  moveKeys: Set<string>;
}

const HELP: Record<Mode, string> = {
  idle: 'Setas/WASD ou mouse: cursor · Z/Enter/clique: selecionar · E: encerrar turno · M: som',
  selected: 'Escolha o destino (azul). Vermelho = alcance da arma · X/Esc/botão direito: cancelar',
  moving: '',
  menu: '↑/↓: escolher · Z/Enter/clique: confirmar · X/Esc: voltar',
  inspect: 'Alcance de ameaça da unidade · X/Esc/clique: fechar',
  targeting: 'Escolha o alvo: setas/mouse alternam · Z/Enter/clique: atacar · X/Esc: voltar',
  busy: '',
};

/**
 * Controlador da batalha: traduz entrada do jogador em comandos para o
 * BattleState (lógica pura) e mantém a visualização sincronizada.
 */
export class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  private mapView!: MapView;
  private panel!: SidePanel;
  private menu!: ActionMenu;
  private sprites = new Map<string, UnitSprite>();
  private mode: Mode = 'idle';
  private cursor: Point = { x: 0, y: 0 };
  private selection?: Selection;
  private menuCancel?: () => void;
  private forecastPanel!: ForecastPanel;
  private eventEngine!: EventEngine;
  private save!: SaveData;
  private ended = false;
  /** Resultado final (lido por testes de ponta a ponta). */
  outcome?: 'victory' | 'defeat';
  private targeting?: Targeting;

  constructor() {
    super('Battle');
  }

  /** Estado da batalha (somente leitura; usado por testes de ponta a ponta). */
  get battle(): BattleState {
    return this.state;
  }

  create(data: { save?: SaveData; stageId?: string; seed?: number }): void {
    // Sem save (atalho de desenvolvimento): campanha Casual começando na fase pedida.
    this.save = data.save ?? devSaveForStage(data.stageId ?? 'c1s1', DB);
    const stage = lookup(DB.stages, currentStageId(this.save, DB) ?? data.stageId ?? 'c1s1', 'Fase');
    this.state = new BattleState(stage, DB, { seed: data.seed, units: buildStageUnits(stage, this.save, DB) });
    this.cameras.main.fadeIn(350);
    this.eventEngine = new EventEngine(this.state);
    this.sprites.clear();
    this.mode = 'busy';
    this.selection = undefined;

    this.mapView = new MapView(this, this.state.map);
    for (const u of this.state.units) this.sprites.set(u.id, new UnitSprite(this, u));
    this.panel = new SidePanel(this, stage.name, stage.objective.description);
    this.menu = new ActionMenu(this);
    this.forecastPanel = new ForecastPanel(this);
    this.targeting = undefined;
    this.ended = false;
    this.outcome = undefined;

    const lord = this.state.unitsOf('player').find((u) => u.isLord) ?? this.state.unitsOf('player')[0];
    if (lord) this.mapView.centerOn(lord.position);
    this.setCursor(lord ? lord.position : { x: 0, y: 0 });
    this.bindInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.mapView.destroy());

    void this.intro();
  }

  /** Diálogo de abertura → banner do turno 1 → eventos de início de turno. */
  private async intro(): Promise<void> {
    await this.wait(300);
    await runDialogue(this, this.state.stage.preDialogue);
    await this.announcePhase();
    await this.runEvents(this.eventEngine.turnStart());
    this.setMode('idle');
  }

  /** Mostra os efeitos de eventos: reforços surgem, recrutas mudam de cor, diálogos rodam. */
  private async runEvents(effects: EventEffects[]): Promise<void> {
    for (const fx of effects) {
      for (const u of fx.spawned) {
        const sprite = new UnitSprite(this, u);
        this.sprites.set(u.id, sprite);
        this.mapView.ensureVisible(u.position, 2, false);
        await sprite.fadeIn();
      }
      for (const u of fx.recruited) {
        this.sprites.get(u.id)?.applyTexture();
        this.sprites.get(u.id)?.refresh();
        await floatText(this, u.x, u.y, 'Recrutado!', '#9cc0ff', 18);
      }
      await runDialogue(this, fx.dialogue);
    }
    this.refreshPanel();
  }

  // -------------------------------------------------------------------------
  // Entrada
  // -------------------------------------------------------------------------

  private bindInput(): void {
    this.input.mouse?.disableContextMenu();
    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => this.onKey(ev.code));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.mode === 'busy' || this.mode === 'moving' || this.menu.isOpen) return;
      const tile = this.mapView.toTile(pointer.x, pointer.y);
      if (!tile || samePoint(tile, this.cursor)) return;
      if (this.mode === 'targeting') {
        const i = this.targeting!.targets.findIndex((t) => samePoint(t.position, tile));
        if (i >= 0) this.selectTarget(i);
        return;
      }
      this.setCursor(tile);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.ended) return; // clique tratado por um item de menu
      if (pointer.rightButtonDown()) {
        this.cancel();
        return;
      }
      if (this.menu.isOpen) {
        this.cancel();
        return;
      }
      const tile = this.mapView.toTile(pointer.x, pointer.y);
      if (!tile) return;
      if (this.mode === 'targeting') {
        const i = this.targeting!.targets.findIndex((t) => samePoint(t.position, tile));
        if (i >= 0) {
          this.selectTarget(i);
          this.confirm();
        }
        return;
      }
      this.setCursor(tile);
      this.confirm();
    });
  }

  private onKey(code: string): void {
    if (code === 'KeyM') {
      this.panel.setHelp(toggleMute() ? 'Som desligado (M para ligar).' : 'Som ligado (M para desligar).');
      return;
    }
    if (this.ended) return;
    const dirs: Record<string, Point> = {
      ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 },
    };
    if (this.menu.isOpen) {
      if (code === 'ArrowUp' || code === 'KeyW') this.menu.moveSelection(-1);
      else if (code === 'ArrowDown' || code === 'KeyS') this.menu.moveSelection(1);
      else if (['Enter', 'KeyZ', 'Space'].includes(code)) this.menu.confirm();
      else if (['Escape', 'KeyX', 'Backspace'].includes(code)) this.cancel();
      return;
    }
    const d = dirs[code];
    if (d && this.mode === 'targeting') {
      const t = this.targeting!;
      this.selectTarget((t.index + (d.x + d.y > 0 ? 1 : -1) + t.targets.length) % t.targets.length);
      return;
    }
    if (d) {
      if (this.mode === 'busy' || this.mode === 'moving') return;
      const next = { x: this.cursor.x + d.x, y: this.cursor.y + d.y };
      if (this.state.map.inBounds(next)) {
        playSfx(this, 'cursor');
        this.setCursor(next);
      }
    } else if (['Enter', 'KeyZ', 'Space'].includes(code)) {
      this.confirm();
    } else if (['Escape', 'KeyX', 'Backspace'].includes(code)) {
      this.cancel();
    } else if (code === 'KeyE' && this.mode === 'idle') {
      void this.runEndPhase();
    }
  }

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  private confirm(): void {
    const p = this.cursor;
    switch (this.mode) {
      case 'idle': {
        const u = this.state.unitAt(p);
        if (u && u.faction === this.state.phase && u.faction === 'player' && u.canAct()) this.select(u);
        else if (u) this.inspect(u);
        else this.openMapMenu();
        break;
      }
      case 'selected': {
        const sel = this.selection!;
        const other = this.state.unitAt(p);
        if (sel.moveKeys.has(pointKey(p))) {
          void this.moveSelected(p);
        } else if (other && other !== sel.unit && other.faction === 'player' && other.canAct()) {
          this.deselect();
          this.select(other);
        }
        break;
      }
      case 'inspect':
        this.clearInspect();
        break;
      case 'targeting': {
        const t = this.targeting!;
        if (t.kind === 'attack') void this.executeAttack(t.sel.unit, t.targets[t.index]);
        else void this.executeHeal(t.sel.unit, t.targets[t.index]);
        break;
      }
      default:
        break;
    }
  }

  private cancel(): void {
    if (this.mode !== 'idle' && this.mode !== 'busy') playSfx(this, 'cancel');
    if (this.menu.isOpen) {
      const back = this.menuCancel;
      this.menu.close();
      this.menuCancel = undefined;
      back?.();
      return;
    }
    if (this.mode === 'selected') this.deselect();
    else if (this.mode === 'inspect') this.clearInspect();
    else if (this.mode === 'targeting') this.cancelTargeting();
  }

  private select(unit: Unit): void {
    playSfx(this, 'select');
    const range = this.state.rangeFor(unit);
    this.selection = { unit, origin: unit.position, range, moveKeys: new Set(range.move.map(pointKey)) };
    this.mapView.showRanges(range.move, range.attack, unit.weapon.type === 'staff' ? 'heal' : 'attack');
    this.sprites.get(unit.id)?.setSelected(true);
    this.setMode('selected');
    this.refreshPanel();
  }

  private deselect(): void {
    if (this.selection) this.sprites.get(this.selection.unit.id)?.setSelected(false);
    this.selection = undefined;
    this.mapView.clearRanges();
    this.setMode('idle');
    this.refreshPanel();
  }

  private inspect(unit: Unit): void {
    const range = this.state.rangeFor(unit);
    this.mapView.showRanges(range.move, range.attack, unit.weapon.type === 'staff' ? 'heal' : 'attack');
    this.setMode('inspect');
  }

  private clearInspect(): void {
    this.mapView.clearRanges();
    this.setMode('idle');
  }

  private async moveSelected(to: Point): Promise<void> {
    const sel = this.selection!;
    this.setMode('moving');
    this.mapView.clearRanges();
    this.sprites.get(sel.unit.id)?.setSelected(false);
    const path = this.state.moveUnit(sel.unit, to);
    if (path.length > 1) playSfx(this, 'move');
    await this.sprites.get(sel.unit.id)?.walk(path);
    this.openUnitMenu(sel);
  }

  private openUnitMenu(sel: Selection): void {
    const u = sel.unit;
    const options: MenuOption[] = [];
    const targets = this.state.targetsInRange(u);
    const healable = this.state.healTargets(u);
    const talks = this.eventEngine.talkOptions(u);
    if (this.state.canSeize(u)) options.push({ id: 'seize', label: 'Tomar' });
    if (targets.length > 0) options.push({ id: 'attack', label: 'Atacar' });
    if (healable.length > 0) options.push({ id: 'heal', label: 'Curar' });
    talks.forEach(([, other], i) => options.push({ id: `talk:${i}`, label: `Conversar (${other.name.split(' ')[0]})` }));
    if (u.items.length > 0) options.push({ id: 'item', label: 'Item' });
    options.push({ id: 'wait', label: 'Esperar' });
    this.menuCancel = () => this.undoMove(sel);
    this.setMode('menu');
    const { x, y } = this.mapView.toScreen(u.position);
    this.menu.open(x + TILE + 6, y - 6, options, (id) => {
      this.menuCancel = undefined;
      if (id === 'wait') void this.finishAction(u);
      else if (id === 'attack') this.startTargeting('attack', sel, targets);
      else if (id === 'heal') this.startTargeting('heal', sel, healable);
      else if (id === 'item') this.openItemMenu(sel);
      else if (id.startsWith('talk:')) void this.executeTalk(u, talks[Number(id.slice(5))][0]);
      else if (id === 'seize') {
        this.state.seize(u);
        void this.finishAction(u);
      }
    });
  }

  private openItemMenu(sel: Selection): void {
    const u = sel.unit;
    const options: MenuOption[] = u.items.map((it, i) => ({
      id: String(i), label: `${it.def.name} (${it.uses})`, enabled: u.hp < u.maxHp,
    }));
    options.push({ id: 'back', label: 'Voltar' });
    this.menuCancel = () => this.openUnitMenu(sel);
    this.setMode('menu');
    this.panel.setHelp(u.hp < u.maxHp ? 'Escolha o item para usar.' : `${u.name} está com o HP cheio.`);
    const { x, y } = this.mapView.toScreen(u.position);
    this.menu.open(x + TILE + 6, y - 6, options, (id) => {
      this.menuCancel = undefined;
      if (id === 'back') {
        this.openUnitMenu(sel);
        return;
      }
      void this.executeItem(u, Number(id));
    });
  }

  private async executeItem(unit: Unit, index: number): Promise<void> {
    this.setMode('busy');
    const amount = this.state.useItem(unit, index);
    playSfx(this, 'heal');
    this.sprites.get(unit.id)?.refresh();
    await floatText(this, unit.x, unit.y, `+${amount} HP`, '#7CFC9A', 18);
    await this.finishAction(unit);
  }

  private async executeTalk(unit: Unit, event: Parameters<EventEngine['talk']>[1]): Promise<void> {
    this.setMode('busy');
    const fx = this.eventEngine.talk(unit, event);
    await this.runEvents([fx]);
    await this.finishAction(unit);
  }

  private async executeHeal(healer: Unit, target: Unit): Promise<void> {
    this.targeting = undefined;
    this.mapView.clearRanges();
    this.setMode('busy');
    const out = this.state.healUnit(healer, target);
    playSfx(this, 'heal');
    this.sprites.get(target.id)?.refresh();
    await floatText(this, target.x, target.y, `+${out.amount} HP`, '#7CFC9A', 20);
    if (out.exp) {
      await floatText(this, healer.x, healer.y, `+${out.exp.amount} EXP`, '#9fe3b0', 16);
      for (const up of out.exp.levelUps) {
        playSfx(this, 'levelup');
        await levelUpPopup(this, healer, up);
      }
    }
    this.refreshPanel();
    await this.finishAction(healer);
  }

  private startTargeting(kind: Targeting['kind'], sel: Selection, targets: Unit[]): void {
    this.targeting = { kind, sel, targets, index: 0 };
    const tiles = targets.map((t) => t.position);
    this.mapView.showRanges([], tiles, kind === 'heal' ? 'heal' : 'attack');
    this.setMode('targeting');
    this.selectTarget(0);
  }

  private selectTarget(i: number): void {
    const t = this.targeting!;
    t.index = i;
    const target = t.targets[i];
    this.cursor = target.position;
    this.mapView.moveCursor(target.position);
    this.mapView.ensureVisible(target.position);
    this.panel.setTerrain(this.state.map.terrainAt(target.position));
    this.panel.setUnit(target);
    if (t.kind === 'attack') {
      this.showForecast(t.sel.unit, target);
    } else {
      const amount = Math.min(target.maxHp - target.hp, (t.sel.unit.weapon.heal ?? 0) + Math.floor(t.sel.unit.stats.mag / 2));
      this.panel.setHelp(`Curar ${target.name}: +${amount} HP (${target.hp} → ${target.hp + amount}) · Z/Enter: confirmar · X/Esc: voltar`);
    }
  }

  private cancelTargeting(): void {
    const sel = this.targeting!.sel;
    this.targeting = undefined;
    this.forecastPanel.hide();
    this.mapView.clearRanges();
    this.setCursor(sel.unit.position);
    this.openUnitMenu(sel);
  }

  private async executeAttack(attacker: Unit, defender: Unit): Promise<void> {
    this.targeting = undefined;
    this.forecastPanel.hide();
    this.mapView.clearRanges();
    this.setMode('busy');
    const outcome = this.state.attack(attacker, defender);
    await this.playCombat(attacker, defender, outcome);
    await this.finishAction(attacker);
  }

  /** Anima os golpes, mortes, EXP e level-ups de um combate já resolvido. */
  private async playCombat(attacker: Unit, defender: Unit, outcome: AttackOutcome): Promise<void> {
    const byId = (id: string) => (id === attacker.id ? attacker : defender);
    for (const strike of outcome.result.strikes) {
      const a = byId(strike.attackerId);
      const d = byId(strike.targetId);
      const aSprite = this.sprites.get(a.id)!;
      const dSprite = this.sprites.get(d.id)!;
      await aSprite.lunge(d.position);
      if (!strike.hit) {
        playSfx(this, 'miss');
        dSprite.dodge();
        await floatText(this, d.x, d.y, 'Errou', '#cfd8e3');
      } else {
        playSfx(this, strike.crit ? 'crit' : 'hit');
        dSprite.flash();
        dSprite.refresh();
        const label = strike.crit ? `CRÍTICO! -${strike.damage}` : `-${strike.damage}`;
        await floatText(this, d.x, d.y, label, strike.crit ? '#ffd34d' : '#ff6b6b', strike.crit ? 22 : 20);
      }
      this.refreshPanel();
    }
    for (const u of [attacker, defender]) {
      if (!u.isAlive()) {
        playSfx(this, 'death');
        await this.sprites.get(u.id)!.fadeOut();
        await this.runEvents(this.eventEngine.unitDefeated(u));
      }
    }
    for (const gain of outcome.exp) {
      await floatText(this, gain.unit.x, gain.unit.y, `+${gain.amount} EXP`, '#9fe3b0', 16);
      for (const up of gain.levelUps) {
        playSfx(this, 'levelup');
        await levelUpPopup(this, gain.unit, up);
      }
    }
    this.refreshSprites();
    this.refreshPanel();
  }

  private undoMove(sel: Selection): void {
    this.state.undoMove(sel.unit, sel.origin);
    this.sprites.get(sel.unit.id)?.snap();
    this.setCursor(sel.origin);
    this.select(sel.unit);
  }

  private async finishAction(unit: Unit): Promise<void> {
    this.state.wait(unit);
    this.sprites.get(unit.id)?.refresh();
    this.selection = undefined;
    this.mapView.clearRanges();
    this.refreshPanel();
    if (this.checkOutcome()) return;
    if (unit.isAlive()) {
      this.setMode('busy');
      await this.runEvents(this.eventEngine.tileReached(unit));
    }
    this.setMode('idle');
    if (this.state.phaseExhausted()) void this.runEndPhase();
  }

  private openMapMenu(): void {
    this.setMode('menu');
    this.menuCancel = () => this.setMode('idle');
    const { x, y } = this.mapView.toScreen(this.cursor);
    this.menu.open(x + TILE + 6, y, [
      { id: 'end', label: 'Encerrar turno' },
      { id: 'cancel', label: 'Cancelar' },
    ], (id) => {
      this.menuCancel = undefined;
      if (id === 'end') void this.runEndPhase();
      else this.setMode('idle');
    });
  }

  /** Passa pelas fases não-jogador até voltar ao jogador. */
  private async runEndPhase(): Promise<void> {
    if (this.ended) return;
    this.setMode('busy');
    this.mapView.clearRanges();
    do {
      this.state.endPhase();
      this.refreshSprites();
      await this.announcePhase();
      await this.showTerrainHeals();
      if (this.state.phase === 'player') await this.runEvents(this.eventEngine.turnStart());
      if (this.checkOutcome()) return;
      if (this.state.phase !== 'player' && (await this.runAiPhase())) return;
    } while (this.state.phase !== 'player');
    this.refreshSprites();
    const lord = this.state.unitsOf('player').find((u) => u.isLord);
    if (lord) this.setCursor(lord.position);
    this.setMode('idle');
  }

  /** Fase inimiga/aliada: cada unidade decide e age, com animação. Retorna true se a batalha acabou. */
  private async runAiPhase(): Promise<boolean> {
    for (const unit of actionOrder(this.state, this.state.unitsOf(this.state.phase))) {
      if (!unit.isAlive() || !unit.canAct()) continue;
      const plan = planAction(this.state, unit);
      const sprite = this.sprites.get(unit.id)!;
      if (!samePoint(plan.moveTo, unit.position)) {
        this.mapView.ensureVisible(unit.position, 2, false);
        const path = this.state.moveUnit(unit, plan.moveTo);
        await sprite.walk(path, 70);
      }
      if (plan.target) {
        this.mapView.moveCursor(plan.target.position);
        this.mapView.ensureVisible(plan.target.position, 2, false);
        this.showForecast(unit, plan.target);
        await this.wait(550);
        this.forecastPanel.hide();
        const outcome = this.state.attack(unit, plan.target);
        await this.playCombat(unit, plan.target, outcome);
      }
      this.state.wait(unit);
      sprite.refresh();
      if (this.checkOutcome()) return true;
    }
    return false;
  }

  private async showTerrainHeals(): Promise<void> {
    if (this.state.phaseHeals.length === 0) return;
    await Promise.all(this.state.phaseHeals.map((h) => floatText(this, h.unit.x, h.unit.y, `+${h.amount}`, '#7CFC9A', 18)));
    this.refreshSprites();
  }

  /** Verifica vitória/derrota e encerra a batalha se for o caso. */
  private checkOutcome(): boolean {
    if (this.ended) return true;
    const result = evaluate(this.state);
    if (result === 'ongoing') return false;
    this.ended = true;
    this.setMode('busy');
    void this.endBattle(result);
    return true;
  }

  private async endBattle(result: 'victory' | 'defeat'): Promise<void> {
    this.menu.close();
    this.forecastPanel.hide();
    this.mapView.clearRanges();
    this.outcome = result;
    outcomeBanner(this, result === 'victory' ? 'Vitória!' : 'Derrota...', result === 'victory' ? 0x8a4a2a : 0x2a2230);
    this.panel.setHelp(result === 'victory'
      ? 'Fase concluída! Pressione Enter ou clique para continuar.'
      : 'Aren caiu e a Crista se apagou... Enter ou clique para continuar.');
    playSfx(this, result === 'victory' ? 'victory' : 'defeat');
    await this.wait(600);
    await this.waitForConfirm();
    let save = this.save;
    if (result === 'victory') {
      await runDialogue(this, this.state.stage.postDialogue);
      save = applyVictory(this.save, this.state);
      writeSave(save);
    }
    this.cameras.main.fadeOut(300);
    await this.wait(320);
    this.scene.start('Result', { result, stageName: this.state.stage.name, save } satisfies ResultData);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, () => resolve()));
  }

  private waitForConfirm(): Promise<void> {
    return new Promise((resolve) => {
      const done = (ev?: KeyboardEvent) => {
        if (ev && !['Enter', 'KeyZ', 'Space'].includes(ev.code)) return;
        this.input.keyboard?.off('keydown', done);
        this.input.off('pointerdown', click);
        resolve();
      };
      const click = () => done();
      this.input.keyboard?.on('keydown', done);
      this.input.on('pointerdown', click);
    });
  }

  private async announcePhase(): Promise<void> {
    this.panel.setTurn(this.state.turn, this.state.phase);
    const label = { player: 'Fase do Jogador', enemy: 'Fase Inimiga', ally: 'Fase Aliada' }[this.state.phase];
    playSfx(this, 'phase');
    await showPhaseBanner(this, this.state.phase === 'player' ? `Turno ${this.state.turn} — ${label}` : label, this.state.phase);
  }

  // -------------------------------------------------------------------------
  // Visualização
  // -------------------------------------------------------------------------

  private setMode(mode: Mode): void {
    this.mode = mode;
    this.panel.setHelp(HELP[mode]);
    this.mapView.setCursorVisible(mode !== 'busy' && mode !== 'moving');
    if (mode !== 'targeting') this.forecastPanel?.hide();
  }

  private setCursor(p: Point): void {
    this.cursor = p;
    this.mapView.moveCursor(p);
    this.mapView.ensureVisible(p);
    this.panel.setTerrain(this.state.map.terrainAt(p));
    this.refreshPanel();
    if (this.mode === 'selected' && this.selection) {
      if (this.selection.moveKeys.has(pointKey(p))) this.mapView.showPath(buildPath(this.selection.range.reach, p));
      else this.mapView.clearPath();
    }
  }

  /** Previsão de combate, posicionada para não cobrir os combatentes. */
  private showForecast(attacker: Unit, defender: Unit): void {
    const half = MAP_AREA.height / 2;
    const onTop = this.mapView.toScreen(attacker.position).y < half && this.mapView.toScreen(defender.position).y < half;
    this.forecastPanel.show(forecast(this.state.map, attacker, defender), onTop);
  }

  private refreshPanel(): void {
    this.panel.setUnit(this.state.unitAt(this.cursor) ?? this.selection?.unit);
  }

  private refreshSprites(): void {
    for (const s of this.sprites.values()) s.refresh();
  }
}
