import { describe, expect, it } from 'vitest';
import {
  HoldRepeater, REPEAT_DELAY_MS, REPEAT_INTERVAL_MS, type Timers, VIRTUAL_KEYS, shouldShowTouchControls,
} from '../src/ui/touch-controls';

const desktop = { search: '', coarsePointer: false, canHover: true, maxTouchPoints: 0 };
const phone = { search: '', coarsePointer: true, canHover: false, maxTouchPoints: 5 };

describe('detecção de celular', () => {
  it('aparece em toque, some no desktop', () => {
    expect(shouldShowTouchControls(phone)).toBe(true);
    expect(shouldShowTouchControls(desktop)).toBe(false);
    // Notebook com tela de toque e mouse: não mostra.
    expect(shouldShowTouchControls({ ...desktop, maxTouchPoints: 10 })).toBe(false);
  });

  it('?touch=1 força e ?touch=0 desliga', () => {
    expect(shouldShowTouchControls({ ...desktop, search: '?touch=1' })).toBe(true);
    expect(shouldShowTouchControls({ ...phone, search: '?stage=c2s1&touch=0' })).toBe(false);
  });
});

describe('teclas virtuais', () => {
  it('equivalem a W/A/S/D, Enter e Esc', () => {
    expect(VIRTUAL_KEYS.up).toEqual({ code: 'KeyW', key: 'w', keyCode: 87 });
    expect(VIRTUAL_KEYS.left.code).toBe('KeyA');
    expect(VIRTUAL_KEYS.down.code).toBe('KeyS');
    expect(VIRTUAL_KEYS.right.code).toBe('KeyD');
    expect(VIRTUAL_KEYS.confirm).toEqual({ code: 'Enter', key: 'Enter', keyCode: 13 });
    expect(VIRTUAL_KEYS.cancel.code).toBe('Escape');
  });
});

/** Relógio falso: avança o tempo e dispara os temporizadores vencidos. */
class FakeTimers implements Timers {
  now = 0;
  private seq = 0;
  private tasks = new Map<number, { at: number; fn: () => void; every?: number }>();
  setTimeout(fn: () => void, ms: number) { const id = ++this.seq; this.tasks.set(id, { at: this.now + ms, fn }); return id; }
  setInterval(fn: () => void, ms: number) { const id = ++this.seq; this.tasks.set(id, { at: this.now + ms, fn, every: ms }); return id; }
  clearTimeout(id: unknown) { this.tasks.delete(id as number); }
  clearInterval(id: unknown) { this.tasks.delete(id as number); }
  advance(ms: number) {
    const end = this.now + ms;
    for (;;) {
      const due = [...this.tasks.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, t] = due;
      this.now = t.at;
      if (t.every) t.at += t.every; else this.tasks.delete(id);
      t.fn();
    }
    this.now = end;
  }
}

describe('segurar o direcional', () => {
  it('dispara na hora e repete enquanto estiver pressionado', () => {
    const timers = new FakeTimers();
    let count = 0;
    const r = new HoldRepeater(() => count++, timers, true);
    r.press();
    expect(count).toBe(1);
    timers.advance(REPEAT_DELAY_MS - 1);
    expect(count).toBe(1);
    timers.advance(1 + REPEAT_INTERVAL_MS * 3);
    expect(count).toBe(4);
    r.release();
    timers.advance(1000);
    expect(count).toBe(4);
  });

  it('Confirmar e Voltar não repetem', () => {
    const timers = new FakeTimers();
    let count = 0;
    const r = new HoldRepeater(() => count++, timers, false);
    r.press();
    timers.advance(2000);
    expect(count).toBe(1);
  });
});
