import { describe, expect, it } from 'vitest';
import { generatePuzzle, overlapsAsSubstring, Rng, toLetters } from './generator';
import { lineCells, matchPlacement } from './selection';
import { GRID_SIZES } from './types';

/** Deterministic RNG so failures are reproducible. */
function mulberry32(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pseudo-words so tests don't depend on the real database. */
function fakeWords(count: number, seed: number): string[] {
  const rng = mulberry32(seed);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: count }, () => {
    const length = 3 + Math.floor(rng() * 8);
    return Array.from({ length }, () => alphabet[Math.floor(rng() * alphabet.length)]).join('');
  });
}

const WORDS = ['APPLE', 'BANANA', 'CHERRY', 'ORANGE', 'GRAPE', 'LEMON', 'MANGO', 'PEACH', 'PLUM', 'MELON', 'KIWI', 'FIG'];

describe('generatePuzzle', () => {
  for (const size of GRID_SIZES) {
    it(`builds a legible ${size}x${size} grid`, () => {
      for (let seed = 1; seed <= 5; seed++) {
        const puzzle = generatePuzzle({
          words: fakeWords(300, seed),
          size,
          allowSubstring: true,
          rng: mulberry32(seed),
        });

        expect(puzzle.grid).toHaveLength(size);
        puzzle.grid.forEach((row) => expect(row).toHaveLength(size));
        expect(puzzle.placements.length).toBeGreaterThan(0);

        for (const { word, cells } of puzzle.placements) {
          const spelled = cells.map((c) => puzzle.grid[c.row][c.col]).join('');
          expect(spelled).toBe(word);
        }
      }
    });
  }

  it('packs several words into a 10x10 grid', () => {
    const puzzle = generatePuzzle({ words: fakeWords(2000, 9), size: 10, allowSubstring: true, rng: mulberry32(9) });
    expect(puzzle.placements.length).toBeGreaterThanOrEqual(8);
  });

  it('copes with the maximum word count on the largest grid', () => {
    const words = fakeWords(5000, 4);
    const started = Date.now();
    const puzzle = generatePuzzle({ words, size: 15, allowSubstring: true, rng: mulberry32(4) });
    expect(puzzle.placements.length).toBeGreaterThan(10);
    expect(Date.now() - started).toBeLessThan(5000);
  });

  it('skips words hidden in other words when substrings are not allowed', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const puzzle = generatePuzzle({
        words: ['CAT', 'CATALOG', 'LOG', 'DOG', 'TAC', 'GOD', 'BIRD'],
        size: 8,
        allowSubstring: false,
        rng: mulberry32(seed),
      });
      const placed = puzzle.placements.map((p) => p.word);
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          expect(overlapsAsSubstring(placed[i], placed[j])).toBe(false);
        }
      }
    }
  });

  it('skips words too long for the grid and deduplicates', () => {
    const puzzle = generatePuzzle({
      words: ['EXTRAORDINARILY', 'CAT', 'CAT'],
      size: 8,
      allowSubstring: true,
      rng: mulberry32(3),
    });
    expect(puzzle.placements.map((p) => p.word)).toEqual(['CAT']);
  });

  it('keeps non-ASCII letters whole', () => {
    expect(toLetters('ÇİĞ')).toEqual(['Ç', 'İ', 'Ğ']);
    const puzzle = generatePuzzle({ words: ['ÇAĞRI'], size: 8, allowSubstring: true, rng: mulberry32(2) });
    expect(puzzle.placements[0].cells).toHaveLength(5);
  });

  it('only overlaps words on matching letters', () => {
    const puzzle = generatePuzzle({ words: WORDS, size: 7, allowSubstring: true, rng: mulberry32(5) });
    for (const { word, cells } of puzzle.placements) {
      expect(cells.map((c) => puzzle.grid[c.row][c.col]).join('')).toBe(word);
    }
  });
});

describe('overlapsAsSubstring', () => {
  it('detects forward, backward and containing words', () => {
    expect(overlapsAsSubstring('CATALOG', 'LOG')).toBe(true);
    expect(overlapsAsSubstring('CATALOG', 'GOL')).toBe(true);
    expect(overlapsAsSubstring('STAR', 'RATS')).toBe(true);
    expect(overlapsAsSubstring('CAT', 'DOG')).toBe(false);
  });
});

describe('lineCells', () => {
  it('returns just the start for a tap', () => {
    expect(lineCells({ row: 2, col: 2 }, { row: 2, col: 2 }, 10)).toEqual([{ row: 2, col: 2 }]);
  });

  it('follows horizontal, vertical and diagonal drags', () => {
    expect(lineCells({ row: 1, col: 1 }, { row: 1, col: 4 }, 10)).toHaveLength(4);
    expect(lineCells({ row: 1, col: 1 }, { row: 4, col: 1 }, 10)).toHaveLength(4);
    expect(lineCells({ row: 1, col: 1 }, { row: 4, col: 4 }, 10).at(-1)).toEqual({ row: 4, col: 4 });
  });

  it('snaps a wobbly drag to the nearest direction', () => {
    const cells = lineCells({ row: 3, col: 0 }, { row: 4, col: 5 }, 10);
    expect(cells.every((c) => c.row === 3)).toBe(true);
    expect(cells).toHaveLength(6);
  });

  it('stays inside the grid', () => {
    expect(lineCells({ row: 0, col: 0 }, { row: 0, col: 20 }, 5)).toHaveLength(5);
  });
});

describe('matchPlacement', () => {
  const puzzle = generatePuzzle({ words: ['CAT'], size: 6, allowSubstring: true, rng: mulberry32(11) });
  const [placement] = puzzle.placements;

  it('matches forwards and backwards', () => {
    expect(matchPlacement(placement.cells, puzzle.placements)).toBe(0);
    expect(matchPlacement([...placement.cells].reverse(), puzzle.placements)).toBe(0);
  });

  it('rejects partial or unrelated selections', () => {
    expect(matchPlacement(placement.cells.slice(0, 2), puzzle.placements)).toBe(-1);
    expect(matchPlacement([{ row: 0, col: 0 }, { row: 0, col: 1 }], [])).toBe(-1);
  });

  it('skips already-found words so words sharing cells can each be found', () => {
    const cells = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    const placements = [
      { word: 'ABC', cells },
      { word: 'CBA', cells: [...cells].reverse() },
    ];
    expect(matchPlacement(cells, placements)).toBe(0);
    expect(matchPlacement(cells, placements, [0])).toBe(1);
    expect(matchPlacement(cells, placements, [0, 1])).toBe(-1);
  });
});
