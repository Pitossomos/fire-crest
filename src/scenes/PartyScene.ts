import Phaser from 'phaser';
import { canPromote, promote, rosterClassId } from '../core/campaign';
import { MAX_ITEMS, canEquip, equipWeapon, giveItem, storeItem, takeItem } from '../core/party';
import { DB } from '../data';
import type { RosterEntry, SaveData } from '../data/types';
import { COLORS, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH } from '../render/layout';
import { TextMenu, type TextMenuOption } from '../render/TextMenu';
import { playSfx } from '../render/sfx';
import { writeSave } from '../save/save';
import type { PartyData, ResultData } from './scene-data';


const MENU_X = 36;
const MENU_Y = 104;
const PANEL_X = 380;

/**
 * Gerenciar o time entre as fases: dar itens, guardar/pegar do baú, equipar
 * armas encontradas e promover com Selos da Brasa. Cada passo troca o menu da
 * esquerda; os detalhes do herói e o baú ficam à direita.
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

  constructor() {
    super('Party');
  }

  create(data: PartyData): void {
    this.save = data.save;
    this.result = data.result;
    this.cameras.main.fadeIn(200);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x15111b).setOrigin(0);
    this.add.rectangle(PANEL_X - 16, 92, GAME_WIDTH - PANEL_X, GAME_HEIGHT - 120, COLORS.panel, 1).setOrigin(0).setStrokeStyle(2, COLORS.panelBorder);
    this.add.text(GAME_WIDTH / 2, 30, 'Gerenciar time', { fontFamily: FONT_TITLE, fontSize: '32px', color: COLORS.accent, fontStyle: 'bold' }).setOrigin(0.5);
    this.header = this.add.text(GAME_WIDTH / 2, 62, '', { fontFamily: FONT_UI, fontSize: '14px', color: COLORS.textDim }).setOrigin(0.5);
    this.prompt = this.add.text(MENU_X - 10, 78, '', { fontFamily: FONT_UI, fontSize: '13px', color: COLORS.textDim });
    this.details = this.add.text(PANEL_X, 104, '', { fontFamily: FONT_UI, fontSize: '14px', color: COLORS.text, lineSpacing: 5 });
    this.convoyText = this.add.text(PANEL_X, 336, '', { fontFamily: FONT_UI, fontSize: '13px', color: COLORS.text, lineSpacing: 4, wordWrap: { width: GAME_WIDTH - PANEL_X - 40 } });
    this.message = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, '', { fontFamily: FONT_UI, fontSize: '14px', color: '#7CFC9A' }).setOrigin(0.5);
    this.heroStep();
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

  private itemLabel(i: { itemId: string; uses: number }): string {
    return `${DB.items[i.itemId].name} (${i.uses})`;
  }

  private weaponLabel(id: string): string {
    const w = DB.weapons[id];
    const range = w.minRange === w.maxRange ? `${w.minRange}` : `${w.minRange}–${w.maxRange}`;
    return w.heal ? `${w.name} · Cura ${w.heal}` : `${w.name} · Pod ${w.might} Pre ${w.hit} Alc ${range}`;
  }

  private refresh(heroId?: string): void {
    this.header.setText(`Selos da Brasa: ${this.save.seals}   ·   Cada herói carrega até ${MAX_ITEMS} itens`);
    const c = this.save.convoy;
    this.convoyText.setText([
      `Baú do grupo — itens: ${c.items.length ? c.items.map((i) => this.itemLabel(i)).join(', ') : 'vazio'}`,
      `Armas: ${c.weapons.length ? c.weapons.map((w) => DB.weapons[w].name).join(', ') : 'nenhuma'}`,
    ].join('\n'));
    if (!heroId) {
      this.details.setText('');
      return;
    }
    const r = this.entry(heroId);
    const cls = DB.classes[rosterClassId(r, DB)];
    const s = r.stats;
    const promo = cls.promotesTo ? (canPromote(r, DB) ? `Pode promover para ${DB.classes[cls.promotesTo].name}` : `Promove para ${DB.classes[cls.promotesTo].name} no nível 5`) : 'Classe avançada ★';
    this.details.setText([
      `${this.name(heroId)} — ${cls.name}  Nv ${r.level}  EXP ${r.exp}`,
      `HP ${s.hp}  FOR ${s.str}  MAG ${s.mag}  HAB ${s.skl}`,
      `VEL ${s.spd}  SOR ${s.lck}  DEF ${s.def}  RES ${s.res}  MOV ${cls.move}`,
      '',
      `Arma: ${this.weaponLabel(r.weaponId)}`,
      `Itens (${r.items.length}/${MAX_ITEMS}): ${r.items.length ? r.items.map((i) => this.itemLabel(i)).join(', ') : '—'}`,
      '',
      promo,
    ].join('\n'));
  }

  private setMenu(prompt: string, options: TextMenuOption[], onPick: (id: string) => void, onCancel: () => void, onHover?: (id: string) => void): void {
    this.menu?.destroy();
    this.prompt.setText(prompt);
    this.menu = new TextMenu(this, MENU_X, MENU_Y, options, onPick, 32, {
      align: 'left', fontSize: 16, width: PANEL_X - MENU_X - 30, onHover, onCancel,
    });
  }

  private done(text: string): void {
    writeSave(this.save);
    playSfx(this, 'heal');
    this.message.setText(text);
  }

  private fail(err: unknown): void {
    playSfx(this, 'cancel');
    this.message.setColor('#ff9a9a').setText(err instanceof Error ? err.message : String(err));
    this.time.delayedCall(1500, () => this.message.setColor('#7CFC9A'));
  }

  // --- passos ----------------------------------------------------------------

  private heroStep(): void {
    this.step = 'hero';
    const heroes = this.alive();
    const options: TextMenuOption[] = heroes.map((r) => {
      const cls = DB.classes[rosterClassId(r, DB)];
      return { id: r.characterId, label: `${this.name(r.characterId)}${canPromote(r, DB) ? ' ✦' : ''}${(cls.tier ?? 1) > 1 ? ' ★' : ''}` };
    });
    options.push({ id: 'exit', label: 'Concluir e voltar' });
    this.refresh(heroes[0]?.characterId);
    this.setMenu('Escolha um herói (✦ pode promover):', options, (id) => (id === 'exit' ? this.exit() : this.actionStep(id)),
      () => this.exit(), (id) => this.refresh(id === 'exit' ? undefined : id));
  }

  private actionStep(heroId: string): void {
    this.step = 'action';
    this.refresh(heroId);
    const r = this.entry(heroId);
    const others = this.alive().filter((o) => o.characterId !== heroId && o.items.length < MAX_ITEMS);
    const equippable = this.save.convoy.weapons.some((w) => canEquip(this.save, heroId, w, DB));
    const options: TextMenuOption[] = [
      { id: 'give', label: 'Dar item a outro herói', enabled: r.items.length > 0 && others.length > 0 },
      { id: 'store', label: 'Guardar item no baú', enabled: r.items.length > 0 },
      { id: 'take', label: 'Pegar item do baú', enabled: this.save.convoy.items.length > 0 && r.items.length < MAX_ITEMS },
      { id: 'equip', label: 'Equipar arma do baú', enabled: equippable },
      { id: 'promote', label: `Promover (${this.save.seals} selo${this.save.seals === 1 ? '' : 's'})`, enabled: this.save.seals > 0 && canPromote(r, DB) },
      { id: 'back', label: 'Voltar' },
    ];
    this.setMenu(`${this.name(heroId)}: o que fazer?`, options, (id) => {
      if (id === 'back') this.heroStep();
      else if (id === 'give') this.pickItem(heroId, (slot) => this.pickTarget(heroId, slot));
      else if (id === 'store') this.pickItem(heroId, (slot) => this.apply(heroId, () => storeItem(this.save, heroId, slot), 'Guardado no baú.'));
      else if (id === 'take') this.pickConvoyItem(heroId);
      else if (id === 'equip') this.pickWeapon(heroId);
      else if (id === 'promote') this.apply(heroId, () => promote(this.save, heroId, DB), () => `${this.name(heroId)} agora é ${DB.classes[rosterClassId(this.entry(heroId), DB)].name}!`, 'levelup');
    }, () => this.heroStep());
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
    this.setMenu(`Equipar qual arma? (a atual volta ao baú)`, options, (id) => {
      if (id === 'back') this.actionStep(heroId);
      else this.apply(heroId, () => equipWeapon(this.save, heroId, Number(id), DB), () => `${this.name(heroId)} equipou ${DB.weapons[this.entry(heroId).weaponId].name}.`);
    }, () => this.actionStep(heroId));
  }

  /** Aplica uma operação do núcleo, grava e volta ao menu de ações do herói. */
  private apply(heroId: string, op: () => SaveData, msg: string | (() => string), sfx: 'heal' | 'levelup' = 'heal'): void {
    try {
      this.save = op();
      this.done(typeof msg === 'string' ? msg : msg());
      if (sfx === 'levelup') playSfx(this, 'levelup');
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
