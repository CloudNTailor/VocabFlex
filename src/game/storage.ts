import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LANGUAGE, LanguageCode, isLanguageCode } from '../db/languages';
import { GRID_SIZES } from './types';

const SETTINGS_KEY = 'vocabflex.settings.v2';
const STATS_KEY = 'vocabflex.stats.v2';

/** Mirrors the original app's preferences screen. */
export interface Settings {
  language: LanguageCode;
  gridSize: number;
  /** Allow a word hidden inside another word. */
  allowSubstring: boolean;
  keepAwake: boolean;
  /** Use one fixed pencil colour instead of a random one per found word. */
  constantPencilColor: boolean;
  pencilColor: string;
  roundedPencil: boolean;
  sound: boolean;
  /** How many random words are drawn from the database for each puzzle. */
  wordCount: number;
}

export const WORD_COUNT_OPTIONS = [500, 1000, 2000, 3000, 4000, 5000];

export const DEFAULT_SETTINGS: Settings = {
  language: DEFAULT_LANGUAGE,
  gridSize: 10,
  allowSubstring: true,
  keepAwake: false,
  constantPencilColor: false,
  pencilColor: '#0099CC',
  roundedPencil: true,
  sound: true,
  wordCount: 5000,
};

function sanitize(raw: Partial<Settings>): Settings {
  const d = DEFAULT_SETTINGS;
  return {
    language: isLanguageCode(raw.language) ? raw.language : d.language,
    gridSize: GRID_SIZES.includes(raw.gridSize as number) ? (raw.gridSize as number) : d.gridSize,
    allowSubstring: typeof raw.allowSubstring === 'boolean' ? raw.allowSubstring : d.allowSubstring,
    keepAwake: typeof raw.keepAwake === 'boolean' ? raw.keepAwake : d.keepAwake,
    constantPencilColor: typeof raw.constantPencilColor === 'boolean' ? raw.constantPencilColor : d.constantPencilColor,
    pencilColor: typeof raw.pencilColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.pencilColor) ? raw.pencilColor : d.pencilColor,
    roundedPencil: typeof raw.roundedPencil === 'boolean' ? raw.roundedPencil : d.roundedPencil,
    sound: typeof raw.sound === 'boolean' ? raw.sound : d.sound,
    wordCount: WORD_COUNT_OPTIONS.includes(raw.wordCount as number) ? (raw.wordCount as number) : d.wordCount,
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Settings are a convenience; losing them is not worth interrupting play.
  }
}

/** Per grid size, like the original best-times table. */
export interface GridStats {
  played: number;
  won: number;
  /** Sum of winning times, for the average. */
  totalSeconds: number;
  /** Fastest win in seconds, or null if never won. */
  best: number | null;
}

export type Stats = Record<string, GridStats>;

const emptyStats = (): GridStats => ({ played: 0, won: 0, totalSeconds: 0, best: null });

export async function loadStats(): Promise<Stats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function updateStats(gridSize: number, update: (s: GridStats) => GridStats): Promise<GridStats | null> {
  const stats = await loadStats();
  const next = update(stats[gridSize] ?? emptyStats());
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify({ ...stats, [gridSize]: next }));
  } catch {
    return null;
  }
  return next;
}

export async function recordGameStarted(gridSize: number): Promise<void> {
  await updateStats(gridSize, (s) => ({ ...s, played: s.played + 1 }));
}

/** Records a win. Returns true when it is a new best time for that grid size. */
export async function recordGameWon(gridSize: number, seconds: number): Promise<boolean> {
  let isBest = false;
  await updateStats(gridSize, (s) => {
    isBest = s.best === null || seconds < s.best;
    return {
      ...s,
      won: s.won + 1,
      totalSeconds: s.totalSeconds + seconds,
      best: isBest ? seconds : s.best,
    };
  });
  return isBest;
}

/** mm:ss like the original chronometer. */
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
