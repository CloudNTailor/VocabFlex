// Samples the bundled SQLite word list into a small JSON file for the web build,
// where expo-sqlite is not usable. Run: node --no-warnings scripts/make-web-words.mjs
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';

const db = new DatabaseSync('assets/db/wordsearch.db', { readOnly: true });
const PER_LANGUAGE = 3000;
const out = {};

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
for (const { name } of tables) {
  out[name] = db
    .prepare(`SELECT word FROM "${name}" WHERE length(word) BETWEEN 3 AND 15 ORDER BY RANDOM() LIMIT ?`)
    .all(PER_LANGUAGE)
    .map((r) => r.word);
}

writeFileSync('src/db/web-words.json', JSON.stringify(out));
console.log(`Wrote ${Object.keys(out).length} languages`);
