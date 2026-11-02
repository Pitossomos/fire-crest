/**
 * Gerador pseudoaleatório com seed (mulberry32).
 * Torna combate e level-up reproduzíveis em testes.
 */
export class Rng {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed >>> 0;
  }

  /** Número em [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inteiro em [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Rola uma chance percentual (0–100). */
  roll(percent: number): boolean {
    return this.int(100) < percent;
  }
}
