import type { SQLiteDatabase } from 'expo-sqlite';
import { LanguageCode, isLanguageCode } from './languages';

export const DATABASE_NAME = 'wordsearch.db';

/** Async source of puzzle words; the only thing the game needs from storage. */
export type WordSource = (
  language: LanguageCode,
  count: number,
  minLength: number,
  maxLength: number,
) => Promise<string[]>;

/** Upper-cases and drops entries that can't go in a grid (spaces, digits, hyphens...). */
export function normalizeWords(rawWords: string[], language: LanguageCode): string[] {
  const words: string[] = [];
  for (const raw of rawWords) {
    // tr needs locale-aware casing (i -> İ), the rest is unaffected.
    const upper = raw.trim().toLocaleUpperCase(language);
    if (/^\p{L}+$/u.test(upper)) words.push(upper);
  }
  return words;
}

/**
 * Native word source backed by the bundled SQLite database. Replace this (and
 * the provider that creates it) to move to a hosted database.
 */
export async function getRandomWords(
  db: SQLiteDatabase,
  language: LanguageCode,
  count: number,
  minLength: number,
  maxLength: number,
): Promise<string[]> {
  // Table names can't be bound parameters, so guard against anything unexpected.
  if (!isLanguageCode(language)) throw new Error(`Unsupported language: ${language}`);

  // A few rows may be rejected by normalizeWords, which is fine at these counts.
  const rows = await db.getAllAsync<{ word: string }>(
    `SELECT word FROM "${language}"
     WHERE length(word) BETWEEN ? AND ?
     ORDER BY RANDOM() LIMIT ?`,
    [minLength, maxLength, count],
  );
  return normalizeWords(
    rows.map((r) => r.word),
    language,
  );
}
