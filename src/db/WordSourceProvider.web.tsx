import React from 'react';
import { LanguageCode } from './languages';
import sampledWords from './web-words.json';
import { WordSource, normalizeWords } from './words';

// expo-sqlite is not usable on web here, so the web build plays from a small
// random sample of each language (see scripts/make-web-words.mjs). For testing only.
const words = sampledWords as Record<string, string[]>;

const webWordSource: WordSource = async (language: LanguageCode, count, min, max) => {
  const pool = normalizeWords(
    (words[language] ?? []).filter((w) => w.length >= min && w.length <= max),
    language,
  );
  // Fisher-Yates over a copy, then take the requested number.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

export function WordSourceProvider({ children }: { children: React.ReactNode; fallback: React.ReactNode }) {
  return <>{children}</>;
}

export function useWordSource(): WordSource {
  return webWordSource;
}
