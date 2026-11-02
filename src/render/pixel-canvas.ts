/** Grade de pixels em memória para desenhar pixel-art proceduralmente. */
export class PixelCanvas {
  readonly width: number;
  readonly height: number;
  private readonly pixels: (string | null)[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Array<string | null>(width * height).fill(null);
  }

  set(x: number, y: number, color: string | null): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.pixels[y * this.width + x] = color;
  }

  get(x: number, y: number): string | null {
    return this.pixels[y * this.width + x] ?? null;
  }

  fill(color: string): void {
    this.pixels.fill(color);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, color);
  }

  /**
   * Desenha um template de texto: cada caractere é procurado na paleta;
   * '.' (ou caractere fora da paleta) é transparente/ignorado.
   */
  stamp(template: readonly string[], palette: Record<string, string>, ox = 0, oy = 0): void {
    template.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const color = palette[ch];
        if (color) this.set(ox + x, oy + y, color);
      });
    });
  }

  /** Copia os pixels para um contexto 2D de canvas. */
  paint(ctx: CanvasRenderingContext2D): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const c = this.get(x, y);
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

/** Hash determinístico simples para variações por tile. */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
