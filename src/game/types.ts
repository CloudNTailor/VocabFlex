export interface Cell {
  row: number;
  col: number;
}

export interface Placement {
  word: string;
  cells: Cell[];
}

export interface Puzzle {
  size: number;
  grid: string[][];
  placements: Placement[];
}

/** Same range as the original app: 5x5 up to 15x15. */
export const MIN_GRID_SIZE = 5;
export const MAX_GRID_SIZE = 15;
export const GRID_SIZES = Array.from({ length: MAX_GRID_SIZE - MIN_GRID_SIZE + 1 }, (_, i) => MIN_GRID_SIZE + i);

/** Shortest word worth putting in a grid. */
export const MIN_WORD_LENGTH = 3;
