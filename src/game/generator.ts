import { Cell, Placement, Puzzle } from './types';

type Direction = { dr: number; dc: number };

const DIRECTIONS: Direction[] = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: -1, dc: 0 },
  { dr: -1, dc: -1 },
  { dr: 1, dc: -1 },
];

export type Rng = () => number;

/** Splits into letters; keeps non-BMP characters whole. */
export function toLetters(word: string): string[] {
  return Array.from(word);
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const reverse = (word: string) => toLetters(word).reverse().join('');

/** True when one word is hidden inside the other, forwards or backwards. */
export function overlapsAsSubstring(a: string, b: string): boolean {
  const ra = reverse(a);
  const rb = reverse(b);
  return a === rb || a.includes(b) || b.includes(a) || a.includes(rb) || b.includes(ra);
}

/**
 * Number of cells the word would share with letters already on the grid, or -1
 * if it doesn't fit there. Mirrors the original app's scoring.
 */
function fitScore(
  grid: (string | null)[][],
  letters: string[],
  size: number,
  row: number,
  col: number,
  { dr, dc }: Direction,
): number {
  const endRow = row + dr * (letters.length - 1);
  const endCol = col + dc * (letters.length - 1);
  if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) return -1;

  let score = 0;
  for (let i = 0; i < letters.length; i++) {
    const existing = grid[row + dr * i][col + dc * i];
    if (existing === null) continue;
    if (existing !== letters[i]) return -1;
    score++;
  }
  return score;
}

export interface GenerateOptions {
  /** Candidate words, already upper-cased. */
  words: string[];
  size: number;
  /** When false, a word hidden inside another placed word is skipped. */
  allowSubstring: boolean;
  rng?: Rng;
}

/**
 * Packs as many of the candidate words into the grid as will fit, like the
 * original app: each word goes where it overlaps the most existing letters.
 * Whatever is left is filled with letters drawn from the placed words.
 */
export function generatePuzzle({ words, size, allowSubstring, rng = Math.random }: GenerateOptions): Puzzle {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array<string | null>(size).fill(null));
  const placements: Placement[] = [];
  const totalCells = size * size;
  let filled = 0;

  const candidates = shuffle([...new Set(words)], rng)
    .map((word) => ({ word, letters: toLetters(word) }))
    .filter(({ letters }) => letters.length > 1 && letters.length <= size);
  const order = shuffle(
    Array.from({ length: totalCells }, (_, i) => i),
    rng,
  );

  for (const { word, letters } of candidates) {
    // Once every cell is used, only perfect overlaps could still fit; not worth the scan.
    if (filled === totalCells) break;
    if (!allowSubstring && placements.some((p) => overlapsAsSubstring(word, p.word))) continue;

    const directions = shuffle(DIRECTIONS, rng);
    let best: { row: number; col: number; dir: Direction } | null = null;
    let bestScore = -1;
    for (const index of order) {
      const row = Math.floor(index / size);
      const col = index % size;
      for (const dir of directions) {
        const score = fitScore(grid, letters, size, row, col, dir);
        if (score > bestScore) {
          best = { row, col, dir };
          bestScore = score;
        }
      }
    }
    if (!best) continue;

    const cells: Cell[] = [];
    for (let i = 0; i < letters.length; i++) {
      const row = best.row + best.dir.dr * i;
      const col = best.col + best.dir.dc * i;
      if (grid[row][col] === null) filled++;
      grid[row][col] = letters[i];
      cells.push({ row, col });
    }
    placements.push({ word, cells });
  }

  const pool = placements.flatMap((p) => toLetters(p.word));
  const filler = pool.length > 0 ? pool : ['A'];
  const filledGrid = grid.map((rowCells) =>
    rowCells.map((letter) => letter ?? filler[Math.floor(rng() * filler.length)]),
  );

  return { size, grid: filledGrid, placements };
}
