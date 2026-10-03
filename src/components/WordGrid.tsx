import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { lineCells } from '../game/selection';
import { Cell, Puzzle } from '../game/types';
import { colors, FOUND_ALPHA } from '../theme/colors';

export interface FoundWord {
  /** Index into puzzle.placements. */
  index: number;
  color: string;
}

interface Props {
  puzzle: Puzzle;
  found: FoundWord[];
  pencilColor: string;
  roundedPencil: boolean;
  width: number;
  disabled?: boolean;
  onSelectionComplete: (cells: Cell[]) => void;
}

interface CapsuleProps {
  start: Cell;
  end: Cell;
  cellSize: number;
  radius: number;
  color: string;
  opacity: number;
}

/** The "pencil" mark: a rounded bar from the first to the last letter of a word. */
function Capsule({ start, end, cellSize, radius, color, opacity }: CapsuleProps) {
  const pad = cellSize / 3.2;
  const dx = (end.col - start.col) * cellSize;
  const dy = (end.row - start.row) * cellSize;
  const length = Math.hypot(dx, dy) + pad * 2;
  const centerX = ((start.col + end.col + 1) / 2) * cellSize;
  const centerY = ((start.row + end.row + 1) / 2) * cellSize;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: centerX - length / 2,
        top: centerY - pad,
        width: length,
        height: pad * 2,
        borderRadius: radius,
        backgroundColor: color,
        opacity,
        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
      }}
    />
  );
}

export function WordGrid({ puzzle, found, pencilColor, roundedPencil, width, disabled, onSelectionComplete }: Props) {
  const { size, grid, placements } = puzzle;
  const cellSize = width / size;
  const radius = roundedPencil ? width / 28 : 0;
  const [selection, setSelection] = useState<Cell[]>([]);

  // PanResponder is created once, so it reads the latest props through a ref.
  const latest = useRef({ size, cellSize, disabled, onSelectionComplete });
  latest.current = { size, cellSize, disabled, onSelectionComplete };
  const start = useRef<Cell | null>(null);
  const current = useRef<Cell[]>([]);

  const panResponder = useMemo(() => {
    const cellAt = (x: number, y: number): Cell => {
      const { size, cellSize } = latest.current;
      const clamp = (v: number) => Math.max(0, Math.min(size - 1, Math.floor(v / cellSize)));
      return { row: clamp(y), col: clamp(x) };
    };
    const update = (cells: Cell[]) => {
      current.current = cells;
      setSelection(cells);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: () => !latest.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        start.current = cellAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
        update([start.current]);
      },
      onPanResponderMove: (e) => {
        if (!start.current) return;
        const end = cellAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
        update(lineCells(start.current, end, latest.current.size));
      },
      onPanResponderRelease: () => {
        const cells = current.current;
        start.current = null;
        update([]);
        if (cells.length > 1) latest.current.onSelectionComplete(cells);
      },
      onPanResponderTerminate: () => {
        start.current = null;
        update([]);
      },
    });
  }, []);

  const fontSize = Math.max(14, Math.min(cellSize * 0.5, 26));

  return (
    <View style={[styles.board, { width, height: width }]} {...panResponder.panHandlers}>
      {/* Children ignore touches so locationX/Y stay relative to the board. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Capsules sit under the letters, as in the original. */}
        {found.map(({ index, color }) => {
          const cells = placements[index].cells;
          return (
            <Capsule
              key={index}
              start={cells[0]}
              end={cells[cells.length - 1]}
              cellSize={cellSize}
              radius={radius}
              color={color}
              opacity={FOUND_ALPHA}
            />
          );
        })}
        {selection.length > 0 && (
          <Capsule
            start={selection[0]}
            end={selection[selection.length - 1]}
            cellSize={cellSize}
            radius={radius}
            color={pencilColor}
            opacity={1}
          />
        )}
        {grid.map((rowLetters, row) => (
          <View key={row} style={styles.row}>
            {rowLetters.map((letter, col) => (
              <View key={col} style={{ width: cellSize, height: cellSize, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.letter, { fontSize }]}>{letter}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: colors.board,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  row: { flexDirection: 'row' },
  letter: { color: colors.letter, fontWeight: '700' },
});
