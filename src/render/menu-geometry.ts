/**
 * Geometria dos menus em coordenadas de TELA (independentes da câmera).
 * A linha inteira é a área clicável, não só o texto — isso evita que um
 * toque "atravesse" o menu e seja tratado como clique no mapa.
 */
export interface MenuRows {
  /** Canto superior esquerdo da primeira linha. */
  x: number;
  y: number;
  width: number;
  rowHeight: number;
  count: number;
  /** Margem extra ao redor das linhas que ainda conta como "dentro do menu". */
  padding?: number;
}

export type MenuHit = number | 'inside' | 'outside';

/** Índice da linha sob o ponto, `'inside'` (na borda do menu) ou `'outside'`. */
export function menuHitTest(m: MenuRows, px: number, py: number): MenuHit {
  const pad = m.padding ?? 0;
  const height = m.count * m.rowHeight;
  const inRows = px >= m.x && px < m.x + m.width && py >= m.y && py < m.y + height;
  if (inRows) return Math.floor((py - m.y) / m.rowHeight);
  const inBox = px >= m.x - pad && px < m.x + m.width + pad && py >= m.y - pad && py < m.y + height + pad;
  return inBox ? 'inside' : 'outside';
}
