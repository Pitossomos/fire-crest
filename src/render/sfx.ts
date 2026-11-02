import Phaser from 'phaser';

export type SfxName =
  | 'cursor' | 'select' | 'cancel' | 'move' | 'hit' | 'crit' | 'miss'
  | 'death' | 'heal' | 'levelup' | 'victory' | 'defeat' | 'phase';

/** Nota: frequência (Hz), duração (s), forma de onda e atraso (s). */
type Note = [number, number, OscillatorType, number];

const SOUNDS: Record<SfxName, { notes: Note[]; noise?: number; gain?: number }> = {
  cursor: { notes: [[880, 0.03, 'square', 0]], gain: 0.25 },
  select: { notes: [[660, 0.05, 'square', 0], [990, 0.06, 'square', 0.05]] },
  cancel: { notes: [[440, 0.05, 'square', 0], [330, 0.07, 'square', 0.05]] },
  move: { notes: [[220, 0.04, 'triangle', 0], [262, 0.04, 'triangle', 0.05]], gain: 0.6 },
  hit: { notes: [[140, 0.08, 'sawtooth', 0]], noise: 0.09 },
  crit: { notes: [[110, 0.1, 'sawtooth', 0], [880, 0.12, 'square', 0.05]], noise: 0.14 },
  miss: { notes: [[1200, 0.04, 'sine', 0], [700, 0.06, 'sine', 0.04]], gain: 0.5 },
  death: { notes: [[330, 0.15, 'triangle', 0], [247, 0.15, 'triangle', 0.15], [165, 0.3, 'triangle', 0.3]] },
  heal: { notes: [[523, 0.08, 'sine', 0], [659, 0.08, 'sine', 0.08], [784, 0.14, 'sine', 0.16]] },
  levelup: { notes: [[523, 0.08, 'square', 0], [659, 0.08, 'square', 0.08], [784, 0.08, 'square', 0.16], [1047, 0.2, 'square', 0.24]] },
  victory: { notes: [[392, 0.15, 'square', 0], [523, 0.15, 'square', 0.15], [659, 0.15, 'square', 0.3], [784, 0.4, 'square', 0.45]] },
  defeat: { notes: [[392, 0.25, 'triangle', 0], [330, 0.25, 'triangle', 0.25], [262, 0.5, 'triangle', 0.5]] },
  phase: { notes: [[330, 0.07, 'square', 0], [494, 0.1, 'square', 0.07]], gain: 0.5 },
};

const MASTER = 0.08;
let muted = false;

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

/** Toca um efeito sonoro sintetizado. Falha em silêncio (sem WebAudio, aba sem foco etc.). */
export function playSfx(scene: Phaser.Scene, name: SfxName): void {
  if (muted) return;
  const ctx = (scene.sound as Partial<Phaser.Sound.WebAudioSoundManager>).context;
  if (!ctx || ctx.state === 'closed') return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const def = SOUNDS[name];
    const gainLevel = MASTER * (def.gain ?? 1);
    const t0 = ctx.currentTime + 0.01;
    for (const [freq, dur, type, delay] of def.notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainLevel, t0 + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + dur + 0.02);
    }
    if (def.noise) {
      const len = Math.floor(ctx.sampleRate * def.noise);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = gainLevel * 1.5;
      src.buffer = buffer;
      src.connect(gain).connect(ctx.destination);
      src.start(t0);
    }
  } catch {
    /* áudio indisponível: segue sem som */
  }
}
