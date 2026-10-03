import { Cell, Placement } from './types';

/**
 * Snaps a drag from `start` to `end` onto the nearest of the 8 straight
 * directions and returns the cells along it (clamped to the grid).
 */
export function lineCells(start: Cell, end: Cell, size: number): Cell[] {
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  if (dr === 0 && dc === 0) return [start];

  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(dr, dc) / step) * step;
  const sr = Math.round(Math.sin(angle));
  const sc = Math.round(Math.cos(angle));
  // Project the drag onto the snapped direction so diagonals feel natural.
  const length = Math.round((dr * sr + dc * sc) / (sr * sr + sc * sc));

  const cells: Cell[] = [];
  for (let i = 0; i <= length; i++) {
    const row = start.row + sr * i;
    const col = start.col + sc * i;
    if (row < 0 || row >= size || col < 0 || col >= size) break;
    cells.push({ row, col });
  }
  return cells;
}

function sameCells(a: Cell[], b: Cell[]): boolean {
  return a.length === b.length && a.every((cell, i) => cell.row === b[i].row && cell.col === b[i].col);
}

/**
 * Index of the placement the selection spells (in either direction), or -1.
 * Placements in `skip` (already found) are passed over, so two words that share
 * exactly the same cells, like STAR and RATS, can each be found in turn.
 */
export function matchPlacement(selection: Cell[], placements: Placement[], skip: number[] = []): number {
  const reversed = [...selection].reverse();
  return placements.findIndex(
    (p, i) => !skip.includes(i) && (sameCells(p.cells, selection) || sameCells(p.cells, reversed)),
  );
}
