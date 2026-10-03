import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuButton } from '../components/MenuButton';
import { RoundButton } from '../components/RoundButton';
import { useBackHandler } from '../components/useBackHandler';
import { FoundWord, WordGrid } from '../components/WordGrid';
import { useWordSource } from '../db/WordSourceProvider';
import { generatePuzzle } from '../game/generator';
import { matchPlacement } from '../game/selection';
import { playSound } from '../game/sounds';
import { formatTime, recordGameStarted, recordGameWon, Settings } from '../game/storage';
import { Cell, MIN_WORD_LENGTH, Puzzle } from '../game/types';
import { colors } from '../theme/colors';

interface Props {
  settings: Settings;
  onExit: () => void;
}

const KEEP_AWAKE_TAG = 'vocabflex-game';

const randomColor = () => {
  const channel = () => Math.floor(Math.random() * 256);
  return `rgb(${channel()}, ${channel()}, ${channel()})`;
};

/** First letter upper-case, the rest lower-case, as the original word list shows. */
const displayWord = (word: string, language: string) => {
  const letters = Array.from(word.toLocaleLowerCase(language));
  return letters[0].toLocaleUpperCase(language) + letters.slice(1).join('');
};

interface Win {
  seconds: number;
  newBest: boolean;
}

export function GameScreen({ settings, onExit }: Props) {
  const getWords = useWordSource();
  const { width, height } = useWindowDimensions();
  const gridWidth = Math.min(width, 520, height - 280);

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<FoundWord[]>([]);
  const [paused, setPaused] = useState(false);
  const [win, setWin] = useState<Win | null>(null);
  const [seconds, setSeconds] = useState(0);
  const elapsedMs = useRef(0);
  const runStart = useRef(0);

  const running = puzzle !== null && !paused && win === null;

  const startGame = useCallback(async () => {
    setPuzzle(null);
    setError(null);
    setFound([]);
    setPaused(false);
    setWin(null);
    setSeconds(0);
    elapsedMs.current = 0;
    try {
      const words = await getWords(settings.language, settings.wordCount, MIN_WORD_LENGTH, settings.gridSize);
      // Let the spinner paint before the (synchronous) packing work starts.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const next = generatePuzzle({ words, size: settings.gridSize, allowSubstring: settings.allowSubstring });
      if (next.placements.length === 0) throw new Error('No words available');
      setPuzzle(next);
      recordGameStarted(settings.gridSize);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [getWords, settings.language, settings.wordCount, settings.gridSize, settings.allowSubstring]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // Chronometer: only counts while the game is running.
  useEffect(() => {
    if (!running) return;
    runStart.current = Date.now() - elapsedMs.current;
    const id = setInterval(() => {
      elapsedMs.current = Date.now() - runStart.current;
      setSeconds(Math.floor(elapsedMs.current / 1000));
    }, 250);
    return () => {
      clearInterval(id);
      elapsedMs.current = Date.now() - runStart.current;
    };
  }, [running]);

  // Pause when the app leaves the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setPaused(true);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!settings.keepAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [settings.keepAwake]);

  // Back pauses a running game; back on the pause menu resumes it.
  useBackHandler(() => {
    if (win !== null || !puzzle) {
      onExit();
    } else {
      setPaused((p) => !p);
    }
    return true;
  });

  const handleSelection = (cells: Cell[]) => {
    if (!puzzle || paused || win) return;
    const index = matchPlacement(cells, puzzle.placements, found.map((f) => f.index));
    if (index < 0) return;

    const next = [...found, { index, color: settings.constantPencilColor ? settings.pencilColor : randomColor() }];
    setFound(next);

    if (next.length < puzzle.placements.length) {
      if (settings.sound) playSound('wordFound');
      return;
    }
    const finalSeconds = Math.floor((Date.now() - runStart.current) / 1000);
    setSeconds(finalSeconds);
    if (settings.sound) playSound('boardFinished');
    recordGameWon(settings.gridSize, finalSeconds).then((newBest) => setWin({ seconds: finalSeconds, newBest }));
    setWin({ seconds: finalSeconds, newBest: false });
  };

  const sortedWords = useMemo(() => {
    if (!puzzle) return [];
    return puzzle.placements
      .map((p, index) => ({ index, label: displayWord(p.word, settings.language) }))
      .sort((a, b) => a.label.localeCompare(b.label, settings.language));
  }, [puzzle, settings.language]);

  const foundIndexes = found.map((f) => f.index);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.timer}>{formatTime(seconds)}</Text>
        {puzzle && !win && (
          <View style={styles.pauseButton}>
            <RoundButton source={require('../../assets/images/ic_pause.png')} size={45} onPress={() => setPaused(true)} accessibilityLabel="Pause" />
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load words: {error}</Text>
          <MenuButton filled label="Try again" onPress={startGame} />
          <MenuButton filled label="Exit Game" onPress={onExit} />
        </View>
      ) : !puzzle ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.timer} size="large" />
        </View>
      ) : (
        <>
          <View style={styles.boardWrap}>
            <WordGrid
              puzzle={puzzle}
              found={found}
              pencilColor={settings.pencilColor}
              roundedPencil={settings.roundedPencil}
              width={gridWidth}
              disabled={paused || win !== null}
              onSelectionComplete={handleSelection}
            />
          </View>

          <View style={styles.labelRow}>
            <View style={styles.rule} />
            <Text style={styles.label}>Words</Text>
            <View style={styles.rule} />
          </View>

          <ScrollView contentContainerStyle={styles.wordList}>
            {sortedWords.map(({ index, label }) => {
              const isFound = foundIndexes.includes(index);
              return (
                <View key={index} style={styles.wordCell}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.word, isFound && styles.wordFound]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}

      {paused && win === null && puzzle && (
        <View style={styles.overlay}>
          <Text style={styles.pauseTime}>{formatTime(seconds)}</Text>
          <MenuButton label="Resume Game" onPress={() => setPaused(false)} />
          <MenuButton label="New Game" onPress={startGame} />
          <MenuButton label="Exit Game" onPress={onExit} />
        </View>
      )}

      {win && (
        <View style={styles.scorePage}>
          <Image source={require('../../assets/images/checkmark.png')} style={styles.checkmark} resizeMode="contain" />
          {win.newBest && <Text style={styles.scoreText}>New Best Time</Text>}
          <Text style={styles.scoreText}>Your duration:</Text>
          <Text style={styles.scoreText}>{formatTime(win.seconds)}</Text>
          <View style={styles.scoreButtons}>
            <MenuButton filled label="New Game" onPress={startGame} />
            <MenuButton filled label="Exit Game" onPress={onExit} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 50, alignItems: 'center', justifyContent: 'center' },
  timer: { color: colors.timer, fontSize: 30, fontWeight: 'bold', fontStyle: 'italic', fontVariant: ['tabular-nums'] },
  pauseButton: { position: 'absolute', right: 4, top: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: colors.heading, textAlign: 'center', marginBottom: 16 },
  boardWrap: { alignItems: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 8 },
  rule: { flex: 1, height: 1, backgroundColor: colors.white, marginHorizontal: 10 },
  label: { color: colors.heading, fontSize: 25, fontWeight: 'bold' },
  wordList: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 60, paddingTop: 4 },
  wordCell: { width: '33.333%', paddingHorizontal: 2, paddingBottom: 5, alignItems: 'center' },
  word: { color: colors.letter, fontSize: 18, fontWeight: 'bold', textAlign: 'center', alignSelf: 'stretch' },
  wordFound: {
    fontWeight: 'normal',
    color: colors.board,
    backgroundColor: colors.greyDark,
    textDecorationLine: 'line-through',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.iceberg,
    opacity: 0.98,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseTime: { color: colors.raspberry, fontSize: 50, marginBottom: 30 },
  scorePage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  checkmark: { width: 300, height: 270, maxWidth: '100%', marginBottom: 20 },
  scoreText: { color: colors.heading, fontSize: 25, fontWeight: 'bold', textAlign: 'center', marginVertical: 4 },
  scoreButtons: { marginTop: 24, alignItems: 'center' },
});
