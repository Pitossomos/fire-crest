import Phaser from 'phaser';
import { canPromote, promote, promotionOptions, rosterClassId } from '../core/campaign';
import { applyArmor, armorBonusLabel } from '../core/equipment';
import {
  MAX_ITEMS, canEquip, canEquipArmor, equipArmor, equipWeapon, giveItem, removeArmor, storeItem, takeItem,
} from '../core/party';
import { DB } from '../data';
import type { ClassDef, RosterEntry, SaveData } from '../data/types';
import { COLORS, CONTENT, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH, fs, fsize } from '../render/layout';
import { TextMenu, type TextMenuOption } from '../render/TextMenu';
import { playSfx } from '../render/sfx';
import { writeSave } from '../save/save';
import type { PartyData, ResultData } from './scene-data';

/** Geometria da tela: menu à esquerda e detalhes à direita, ou empilhados no retrato. */
interface PartyGeometry {
  menuX: number; menuY: number; menuW: number;
  panelX: number; panelY: number; panelW: number; panelH: number;
  convoyY: number;
}

function partyGeometry(): PartyGeometry {
  const { x, y, width, height } = CONTENT;
  if (width >= 800) {
    const panelX = x + Math.round(width * 0.4);
    return {
      menuX: x + 36, menuY: y + 124, menuW: panelX - x - 66,
      panelX, panelY: y + 104, panelW: x + width - panelX - 40, panelH: height - 132,
      convoyY: y + fsize(372),
    };
  }
  // Retrato: até 11 linhas de menu em cima, detalhes e baú embaixo.
  const panelY = y + 130 + 11 * fsize(32) + 8;
  const panelH = height - (panelY - y) - 40;
  return {
    menuX: x + 30, menuY: y + 130, menuW: width - 60,
    panelX: x + 30, panelY: panelY + 12, panelW: width - 60, panelH,
    convoyY: panelY + 12 + 13 * (fsize(14) + 5),
  };
}

const WEAPON_TYPE_NAME: Record<string, string> = {
  sword: 'espada', lance: 'lança', axe: 'machado', bow: 'arco', tome: 'tomo',
  light: 'luz', dark: 'trevas', staff: 'cajado', claw: 'garras',
};

/**
 * Gerenciar o time entre as fases: promover (nível 5+, com escolha de caminho
 * no nível 3), dar itens, guardar/pegar do baú, equipar armas e armaduras.
 * Cada passo troca o menu da esquerda; os detalhes do herói e o baú ficam à direita.
 */
export class PartyScene extends Phaser.Scene {
  /** Menu atual (lido por testes de ponta a ponta). */
  menu?: TextMenu;
  /** Passo atual (lido por testes de ponta a ponta). */
  step = 'hero';
  private save!: SaveData;
  private result!: ResultData;
  private details!: Phaser.GameObjects.Text;
  private convoyText!: Phaser.GameObjects.Text;
  private header!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private geo!: PartyGeometry;
  private lastData?: PartyData;

  constructor() {
    super('Party');
  }

  /** Troca de orientação: redesenha no tamanho novo, com o save atualizado. */
  relayout(): void {
    if (this.lastData) this.scene.restart({ ...this.lastData, save: this.save });
  }

  create(data: PartyData): void {
    this.lastData = data;
    const geo = partyGeometry();
    this.geo = geo;
    const cx = CONTENT.x + CONTENT.width / 2;
    this.save = data.save;
    this.result = data.result;
    this.cameras.main.fadeIn(200);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x15111b).setOrigin(0);
    this.add.rectangle(geo.panelX - 16, geo.panelY - 12, geo.panelW + 32, geo.panelH, COLORS.panel, 1).setOrigin(0).setStrokeStyle(2, COLORS.panelBorder);
    this.add.text(cx, 30, data.focus === 'promote' ? 'Promover heróis' : 'Gerenciar time', {
      fontFamily: FONT_TITLE, fontSize: '32px', color: COLORS.accent, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.header = this.add.text(cx, 60, '', { fontFamily: FONT_UI, fontSize: fs(14), color: COLORS.textDim, align: 'center', wordWrap: { width: CONTENT.width - 20 } }).setOrigin(0.5);
    // Instrução acima do menu (até duas linhas), ancorada pela base.
    this.prompt = this.add.text(geo.menuX - 10, geo.menuY - 18, '', { fontFamily: FONT_UI, fontSize: fs(13), color: COLORS.textDim, wordWrap: { width: geo.menuW + 20 } }).setOrigin(0, 1);
    this.details = this.add.text(geo.panelX, geo.panelY, '', { fontFamily: FONT_UI, fontSize: fs(14), color: COLORS.text, lineSpacing: 5, wordWrap: { width: geo.panelW } });
    this.convoyText = this.add.text(geo.panelX, geo.convoyY, '', { fontFamily: FONT_UI, fontSize: fs(13), color: COLORS.text, lineSpacing: 4, wordWrap: { width: geo.panelW } });
    this.message = this.add.text(cx, CONTENT.y + CONTENT.height - 16, '', { fontFamily: FONT_UI, fontSize: fs(14), color: '#7CFC9A', align: 'center', wordWrap: { width: CONTENT.width - 20 } }).setOrigin(0.5);
    if (data.focus === 'promote') this.promoteListStep();
    else this.heroStep();
  }

  // ---------------------------------------------------------------------------

  private alive(): RosterEntry[] {
    return this.save.roster.filter((r) => r.alive);
  }

  private entry(id: string): RosterEntry {
    return this.save.roster.find((r) => r.characterId === id)!;
  }

  private name(id: string): string {
    return DB.characters[id].name;
  }

  private cls(r: RosterEntry): ClassDef {
    return DB.classes[rosterClassId(r, DB)];
  }

  private stars(c: ClassDef): string {
    return (c.tier ?? 1) > 2 ? ' ★★' : (c.tier ?? 1) > 1 ? ' ★' : '';
  }

  private itemLabel(i: { itemId: string; uses: number }): string {
    return `${DB.items[i.itemId].name} (${i.uses})`;
  }

  private weaponLabel(id: string): string {
    const w = DB.weapons[id];
    const range = w.minRange === w.maxRange ? `${w.minRange}` : `${w.minRange}–${w.maxRange}`;
    return w.heal ? `${w.name} · Cura ${w.heal}` : `${w.name} · Pod ${w.might} Pre ${w.hit} Alc ${range}`;
  }

  private armorLabel(id: string): string {
    const a = DB.armors[id];
    return `${a.name} · ${armorBonusLabel(a)}`;
  }

  private weaponTypes(c: ClassDef): string {
    return c.weaponTypes.map((t) => WEAPON_TYPE_NAME[t] ?? t).join('/');
  }

  private refresh(heroId?: string): void {
    const ready = this.alive().filter((r) => canPromote(r, DB)).length;
    this.header.setText(`${ready ? `${ready} herói${ready === 1 ? '' : 's'} pronto${ready === 1 ? '' : 's'} para promover ✦   ·   ` : ''}Cada herói carrega até ${MAX_ITEMS} itens`);
    const c = this.save.convoy;
    this.convoyText.setText([
      `Baú — itens: ${c.items.length ? c.items.map((i) => this.itemLabel(i)).join(', ') : 'vazio'}`,
      `Armas: ${c.weapons.length ? c.weapons.map((w) => DB.weapons[w].name).join(', ') : 'nenhuma'}`,
      `Armaduras: ${c.armors.length ? c.armors.map((a) => DB.armors[a].name).join(', ') : 'nenhuma'}`,
    ].join('\n'));
    if (!heroId) {
      this.details.setText('');
      return;
    }
    const r = this.entry(heroId);
    const cls = this.cls(r);
    const armor = r.armorId ? DB.armors[r.armorId] : undefined;
    const s = applyArmor(r.stats, armor, 1);
    const options = promotionOptions(r, DB).map((id) => DB.classes[id].name);
    const promo = options.length === 0
      ? 'Classe mestra ★★ — topo da árvore.'
      : canPromote(r, DB) ? `Pronto para promover: ${options.join(' ou ')}` : `No nível 5 promove para: ${options.join(' ou ')}`;
    this.details.setText([
      `${this.name(heroId)} — ${cls.name}${this.stars(cls)}  Nv ${r.level}  EXP ${r.exp}`,
      `HP ${s.hp}  FOR ${s.str}  MAG ${s.mag}  HAB ${s.skl}`,
      `VEL ${s.spd}  SOR ${s.lck}  DEF ${s.def}  RES ${s.res}  MOV ${cls.move}`,
      '',
      `Arma: ${this.weaponLabel(r.weaponId)}`,
      `Usa: ${this.weaponTypes(cls)}${cls.heavyArmor ? ' · veste armaduras pesadas' : ''}`,
      `Armadura: ${armor ? this.armorLabel(armor.id) : '—'}`,
      `Itens (${r.items.length}/${MAX_ITEMS}): ${r.items.length ? r.items.map((i) => this.itemLabel(i)).join(', ') : '—'}`,
      '',
      promo,
    ].join('\n'));
  }

  private setMenu(prompt: string, options: TextMenuOption[], onPick: (id: string) => void, onCancel: () => void, onHover?: (id: string) => void): void {
    this.menu?.destroy();
    this.prompt.setText(prompt);
    this.menu = new TextMenu(this, this.geo.menuX, this.geo.menuY, options, onPick, fsize(32), {
      align: 'left', fontSize: 16, width: this.geo.menuW, onHover, onCancel,
    });
  }

  private done(text: string): void {
    writeSave(this.save);
    this.message.setColor('#7CFC9A').setText(text);
  }

  private fail(err: unknown): void {
    playSfx(this, 'cancel');
    this.message.setColor('#ff9a9a').setText(err instanceof Error ? err.message : String(err));
  }

  // --- passos ----------------------------------------------------------------

  private heroStep(): void {
    this.step = 'hero';
    const heroes = this.alive();
    const options: TextMenuOption[] = heroes.map((r) => ({
      id: r.characterId,
      label: `${this.name(r.characterId)}${canPromote(r, DB) ? ' ✦' : ''}${this.stars(this.cls(r))}`,
    }));
    options.push({ id: 'exit', label: 'Concluir e voltar' });
    this.refresh(heroes[0]?.characterId);
    this.setMenu('Escolha um herói (✦ pronto para promover):', options, (id) => (id === 'exit' ? this.exit() : this.actionStep(id)),
      () => this.exit(), (id) => this.refresh(id === 'exit' ? undefined : id));
  }

  private actionStep(heroId: string): void {
    this.step = 'action';
    this.refresh(heroId);
    const r = this.entry(heroId);
    const others = this.alive().filter((o) => o.characterId !== heroId && o.items.length < MAX_ITEMS);
    const options: TextMenuOption[] = [
      { id: 'promote', label: 'Promover', enabled: canPromote(r, DB) },
      { id: 'give', label: 'Dar item a outro herói', enabled: r.items.length > 0 && others.length > 0 },
      { id: 'store', label: 'Guardar item no baú', enabled: r.items.length > 0 },
      { id: 'take', label: 'Pegar item do baú', enabled: this.save.convoy.items.length > 0 && r.items.length < MAX_ITEMS },
      { id: 'equip', label: 'Equipar arma do baú', enabled: this.save.convoy.weapons.some((w) => canEquip(this.save, heroId, w, DB)) },
      { id: 'armor', label: 'Vestir armadura do baú', enabled: this.save.convoy.armors.some((a) => canEquipArmor(this.save, heroId, a, DB)) },
      { id: 'unarmor', label: 'Tirar armadura', enabled: !!r.armorId },
      { id: 'back', label: 'Voltar' },
    ];
    this.setMenu(`${this.name(heroId)}: o que fazer?`, options, (id) => {
      if (id === 'back') this.heroStep();
      else if (id === 'promote') this.promoteStep(heroId, () => this.actionStep(heroId));
      else if (id === 'give') this.pickItem(heroId, (slot) => this.pickTarget(heroId, slot));
      else if (id === 'store') this.pickItem(heroId, (slot) => this.apply(heroId, () => storeItem(this.save, heroId, slot), 'Guardado no baú.'));
      else if (id === 'take') this.pickConvoyItem(heroId);
      else if (id === 'equip') this.pickWeapon(heroId);
      else if (id === 'armor') this.pickArmor(heroId);
      else if (id === 'unarmor') this.apply(heroId, () => removeArmor(this.save, heroId), 'Armadura guardada no baú.');
    }, () => this.heroStep());
  }

  /** Lista só dos heróis prontos (atalho da tela de resultado). */
  private promoteListStep(): void {
    this.step = 'promoteList';
    const ready = this.alive().filter((r) => canPromote(r, DB));
    if (ready.length === 0) {
      this.heroStep();
      return;
    }
    const options: TextMenuOption[] = ready.map((r) => ({
      id: r.characterId,
      label: `${this.name(r.characterId)}: ${this.cls(r).name} → ${promotionOptions(r, DB).map((c) => DB.classes[c].name).join(' / ')}`,
    }));
    options.push({ id: 'later', label: 'Agora não — gerenciar o time' });
    options.push({ id: 'exit', label: 'Concluir e voltar' });
    this.refresh(ready[0].characterId);
    this.setMenu('Quem promover? (o herói volta ao nível 1 da classe nova)', options, (id) => {
      if (id === 'later') this.heroStep();
      else if (id === 'exit') this.exit();
      else this.promoteStep(id, () => this.promoteListStep());
    }, () => this.heroStep(), (id) => this.refresh(['later', 'exit'].includes(id) ? undefined : id));
  }

  /** Escolha do caminho (ou confirmação, quando há um só destino). */
  private promoteStep(heroId: string, back: () => void): void {
    this.step = 'promote';
    const r = this.entry(heroId);
    const targets = promotionOptions(r, DB);
    const preview = (target: string) => {
      const to = DB.classes[target];
      const b = to.promotionBonus;
      const bonus = b ? Object.entries(b).filter(([, v]) => v > 0).map(([k, v]) => `+${v} ${({ hp: 'HP', str: 'FOR', mag: 'MAG', skl: 'HAB', spd: 'VEL', lck: 'SOR', def: 'DEF', res: 'RES' } as Record<string, string>)[k]}`).join(', ') : '';
      this.details.setText([
        `${this.name(heroId)}: ${this.cls(r).name} → ${to.name}${this.stars(to)}`,
        '',
        to.blurb ?? '',
        `Bônus: ${bonus}`,
        `Movimento: ${to.move}   ·   Usa: ${this.weaponTypes(to)}`,
        to.heavyArmor ? 'Veste armaduras pesadas.' : '',
        '',
        'O herói volta ao nível 1 da classe nova, com mais espaço para crescer.',
      ].join('\n'));
    };
    const options: TextMenuOption[] = targets.map((t) => ({ id: t, label: `${targets.length > 1 ? 'Caminho: ' : 'Promover para '}${DB.classes[t].name}` }));
    options.push({ id: 'back', label: 'Agora não' });
    preview(targets[0]);
    this.setMenu(targets.length > 1 ? 'Escolha o caminho:' : 'Confirmar a promoção?', options, (id) => {
      if (id === 'back') {
        back();
        return;
      }
      try {
        this.save = promote(this.save, heroId, DB, id);
        playSfx(this, 'levelup');
        this.done(`${this.name(heroId)} agora é ${DB.classes[id].name}!`);
      } catch (err) {
        this.fail(err);
      }
      back();
    }, back, (id) => (id === 'back' ? this.refresh(heroId) : preview(id)));
  }

  private pickItem(heroId: string, next: (slot: number) => void): void {
    this.step = 'pickItem';
    const options: TextMenuOption[] = this.entry(heroId).items.map((i, k) => ({ id: String(k), label: this.itemLabel(i) }));
    options.push({ id: 'back', label: 'Voltar' });
    this.setMenu('Qual item?', options, (id) => (id === 'back' ? this.actionStep(heroId) : next(Number(id))), () => this.actionStep(heroId));
  }

  private pickTarget(heroId: string, slot: number): void {
    this.step = 'pickTarget';
    const options: TextMenuOption[] = this.alive().filter((o) => o.characterId !== heroId).map((o) => ({
      id: o.characterId, label: `${this.name(o.characterId)} (${o.items.length}/${MAX_ITEMS})`, enabled: o.items.length < MAX_ITEMS,
    }));
    options.push({ id: 'back', label: 'Voltar' });
    this.setMenu('Para quem?', options, (id) => {
      if (id === 'back') this.actionStep(heroId);
      else this.apply(heroId, () => giveItem(this.save, heroId, slot, id), `Entregue a ${this.name(id)}.`);
    }, () => this.actionStep(heroId), (id) => this.refresh(id === 'back' ? heroId : id));
  }

  private pickConvoyItem(heroId: string): void {
    this.step = 'pickConvoyItem';
    const options: TextMenuOption[] = this.save.convoy.items.map((i, k) => ({ id: String(k), label: this.itemLabel(i) }));
    options.push({ id: 'back', label: 'Voltar' });
    this.setMenu('Pegar qual item do baú?', options, (id) => {
      if (id === 'back') this.actionStep(heroId);
      else this.apply(heroId, () => takeItem(this.save, Number(id), heroId), 'Item retirado do baú.');
    }, () => this.actionStep(heroId));
  }

  private pickWeapon(heroId: string): void {
    this.step = 'pickWeapon';
    const options: TextMenuOption[] = this.save.convoy.weapons.map((w, k) => ({
      id: String(k), label: this.weaponLabel(w), enabled: canEquip(this.save, heroId, w, DB),
    }));
    options.push({ id: 'back', label: 'Voltar' });
    this.setMenu('Equipar qual arma? (a atual volta ao baú)', options, (id) => {
      if (id === 'back') this.actionStep(heroId);
      else this.apply(heroId, () => equipWeapon(this.save, heroId, Number(id), DB), () => `${this.name(heroId)} equipou ${DB.weapons[this.entry(heroId).weaponId].name}.`);
    }, () => this.actionStep(heroId));
  }

  private pickArmor(heroId: string): void {
    this.step = 'pickArmor';
    const options: TextMenuOption[] = this.save.convoy.armors.map((a, k) => ({
      id: String(k), label: this.armorLabel(a), enabled: canEquipArmor(this.save, heroId, a, DB),
    }));
    options.push({ id: 'back', label: 'Voltar' });
    this.setMenu('Vestir qual armadura? (a atual volta ao baú)', options, (id) => {
      if (id === 'back') this.actionStep(heroId);
      else this.apply(heroId, () => equipArmor(this.save, heroId, Number(id), DB), () => `${this.name(heroId)} vestiu ${DB.armors[this.entry(heroId).armorId!].name}.`);
    }, () => this.actionStep(heroId));
  }

  /** Aplica uma operação do núcleo, grava e volta ao menu de ações do herói. */
  private apply(heroId: string, op: () => SaveData, msg: string | (() => string)): void {
    try {
      this.save = op();
      playSfx(this, 'heal');
      this.done(typeof msg === 'string' ? msg : msg());
    } catch (err) {
      this.fail(err);
    }
    this.actionStep(heroId);
  }

  private exit(): void {
    writeSave(this.save);
    this.cameras.main.fadeOut(200);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Result', { ...this.result, save: this.save, message: undefined, fromParty: true } satisfies ResultData);
    });
  }
}
