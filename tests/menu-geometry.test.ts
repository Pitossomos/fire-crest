import { describe, expect, it } from 'vitest';
import { menuHitTest } from '../src/render/menu-geometry';

describe('área clicável dos menus', () => {
  const m = { x: 100, y: 50, width: 172, rowHeight: 34, count: 3, padding: 6 };

  it('a linha inteira conta, inclusive a ponta direita, longe do texto', () => {
    expect(menuHitTest(m, 105, 52)).toBe(0);
    expect(menuHitTest(m, 271, 50 + 34 + 30)).toBe(1); // ponta direita da 2ª linha
    expect(menuHitTest(m, 200, 50 + 34 * 3 - 1)).toBe(2);
  });

  it('a borda do menu não é "fora" (não cancela)', () => {
    expect(menuHitTest(m, 97, 60)).toBe('inside');
    expect(menuHitTest(m, 200, 50 + 34 * 3 + 3)).toBe('inside');
  });

  it('longe do menu é fora', () => {
    expect(menuHitTest(m, 20, 20)).toBe('outside');
    expect(menuHitTest(m, 400, 60)).toBe('outside');
  });
});
