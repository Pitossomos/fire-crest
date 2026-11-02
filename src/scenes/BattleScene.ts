import Phaser from 'phaser';
import { DB, lookup } from '../data';
import { BattleState, type RangeInfo } from '../core/battle-state';
import { type Point, pointKey, samePoint } from '../core/grid';
import { buildPath } from '../core/pathfinding';
import type { Unit } from '../core/unit';
import { MapView } from '../render/MapView';
import { UnitSprite } from '../render/UnitSprite';
import { SidePanel } from '../render/SidePanel';
import { ActionMenu, type MenuOption } from '../render/ActionMenu';
import { showPhaseBanner } from '../render/PhaseBanner';
import { TILE } from '../render/layout';

/** Modos de interação do jogador. */
type Mode = 'idle' | 'selected' | 'moving' | 'menu' | 'inspect' | 'busy';

interface Selection {
  unit: Unit;
  origin: Point;
  range: RangeInfo;
  moveKeys: Set<string>;
}

const HELP: Record<Mode, string> = {
  idle: 'Setas/WASD ou mouse: cursor · Z/Enter/clique: selecionar · E: encerrar turno',
  selected: 'Escolha o destino (azul). Vermelho = alcance da arma · X/Esc/botão direito: cancelar',
  moving: '',
  menu: '↑/↓: escolher · Z/Enter/clique: confirmar · X/Esc: voltar',
  inspect: 'Alcance de ameaça da unidade · X/Esc/clique: fechar',
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

  constructor() {
    super('Battle');
  }

  /** Estado da batalha (somente leitura; usado por testes de ponta a ponta). */
  get battle(): BattleState {
    return this.state;
  }

  create(data: { stageId?: string }): void {
    const stage = lookup(DB.stages, data.stageId ?? 'c1s1', 'Fase');
    this.state = new BattleState(stage, DB);
    this.sprites.clear();
    this.mode = 'busy';
    this.selection = undefined;

    this.mapView = new MapView(this, this.state.map);
    for (const u of this.state.units) this.sprites.set(u.id, new UnitSprite(this, u));
    this.panel = new SidePanel(this, stage.name, stage.objective.description);
    this.menu = new ActionMenu(this);

    const lord = this.state.unitsOf('player').find((u) => u.isLord) ?? this.state.unitsOf('player')[0];
    this.setCursor(lord ? lord.position : { x: 0, y: 0 });
    this.bindInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.mapView.destroy());

    void this.announcePhase().then(() => this.setMode('idle'));
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
      if (tile && !samePoint(tile, this.cursor)) this.setCursor(tile);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0) return; // clique tratado por um item de menu
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
      this.setCursor(tile);
      this.confirm();
    });
  }

  private onKey(code: string): void {
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
    if (d) {
      if (this.mode === 'busy' || this.mode === 'moving') return;
      const next = { x: this.cursor.x + d.x, y: this.cursor.y + d.y };
      if (this.state.map.inBounds(next)) this.setCursor(next);
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
      default:
        break;
    }
  }

  private cancel(): void {
    if (this.menu.isOpen) {
      const back = this.menuCancel;
      this.menu.close();
      this.menuCancel = undefined;
      back?.();
      return;
    }
    if (this.mode === 'selected') this.deselect();
    else if (this.mode === 'inspect') this.clearInspect();
  }

  private select(unit: Unit): void {
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
    await this.sprites.get(sel.unit.id)?.walk(path);
    this.openUnitMenu(sel);
  }

  private openUnitMenu(sel: Selection): void {
    // Atacar, Curar, Conversar e Item entram nos marcos M2 e M5.
    const options: MenuOption[] = [{ id: 'wait', label: 'Esperar' }];
    this.menuCancel = () => this.undoMove(sel);
    this.setMode('menu');
    const { x, y } = MapView.toPixel(sel.unit.position);
    this.menu.open(x + TILE + 6, y - 6, options, (id) => {
      this.menuCancel = undefined;
      if (id === 'wait') this.finishAction(sel.unit);
    });
  }

  private undoMove(sel: Selection): void {
    this.state.undoMove(sel.unit, sel.origin);
    this.sprites.get(sel.unit.id)?.snap();
    this.setCursor(sel.origin);
    this.select(sel.unit);
  }

  private finishAction(unit: Unit): void {
    this.state.wait(unit);
    this.sprites.get(unit.id)?.refresh();
    this.selection = undefined;
    this.mapView.clearRanges();
    this.setMode('idle');
    this.refreshPanel();
    if (this.state.phaseExhausted()) void this.runEndPhase();
  }

  private openMapMenu(): void {
    this.setMode('menu');
    this.menuCancel = () => this.setMode('idle');
    const { x, y } = MapView.toPixel(this.cursor);
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
    this.setMode('busy');
    this.mapView.clearRanges();
    do {
      this.state.endPhase();
      this.refreshSprites();
      await this.announcePhase();
      if (this.state.phase !== 'player') {
        // IA inimiga/aliada chega no marco M3; por ora a fase só passa.
        await new Promise((r) => this.time.delayedCall(350, r));
      }
    } while (this.state.phase !== 'player');
    this.refreshSprites();
    this.setMode('idle');
  }

  private async announcePhase(): Promise<void> {
    this.panel.setTurn(this.state.turn, this.state.phase);
    const label = { player: 'Fase do Jogador', enemy: 'Fase Inimiga', ally: 'Fase Aliada' }[this.state.phase];
    await showPhaseBanner(this, this.state.phase === 'player' ? `Turno ${this.state.turn} — ${label}` : label, this.state.phase);
  }

  // -------------------------------------------------------------------------
  // Visualização
  // -------------------------------------------------------------------------

  private setMode(mode: Mode): void {
    this.mode = mode;
    this.panel.setHelp(HELP[mode]);
    this.mapView.setCursorVisible(mode !== 'busy' && mode !== 'moving');
  }

  private setCursor(p: Point): void {
    this.cursor = p;
    this.mapView.moveCursor(p);
    this.panel.setTerrain(this.state.map.terrainAt(p));
    this.refreshPanel();
    if (this.mode === 'selected' && this.selection) {
      if (this.selection.moveKeys.has(pointKey(p))) this.mapView.showPath(buildPath(this.selection.range.reach, p));
      else this.mapView.clearPath();
    }
  }

  private refreshPanel(): void {
    this.panel.setUnit(this.state.unitAt(this.cursor) ?? this.selection?.unit);
  }

  private refreshSprites(): void {
    for (const s of this.sprites.values()) s.refresh();
  }
}
