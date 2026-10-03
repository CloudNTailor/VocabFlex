import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBackHandler } from '../components/useBackHandler';
import { formatTime, loadStats, Stats } from '../game/storage';
import { GRID_SIZES } from '../game/types';
import { colors } from '../theme/colors';

const NONE = '--:--';

export function BestTimesScreen({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<Stats>({});
  useEffect(() => {
    loadStats().then(setStats);
  }, []);
  useBackHandler(() => {
    onBack();
    return true;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Image source={require('../../assets/images/info_bg.png')} style={styles.backdrop} resizeMode="cover" />
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Best Times</Text>
        <View style={styles.back} />
      </View>

      <FlatList
        data={GRID_SIZES}
        keyExtractor={(size) => String(size)}
        contentContainerStyle={styles.list}
        renderItem={({ item: size }) => {
          const s = stats[size];
          const average = s && s.won > 0 ? formatTime(Math.round(s.totalSeconds / s.won)) : NONE;
          return (
            <View style={styles.item}>
              <Text style={styles.gridSize}>{`${size}x${size}`}</Text>
              <Row label="Total Play" value={String(s?.played ?? 0)} />
              <Row label="Total Win" value={String(s?.won ?? 0)} />
              <Row label="AverageTime" value={average} />
              <Row label="Best Times" value={s?.best != null ? formatTime(s.best) : NONE} />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowText, styles.rowLabel]}>{label}</Text>
      <Text style={[styles.rowText, styles.rowValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 20 },
  back: { width: 40, color: colors.heading, fontSize: 40 },
  title: { flex: 1, color: colors.heading, fontSize: 40, textAlign: 'center', padding: 10 },
  list: { paddingBottom: 30 },
  item: { padding: 15, maxWidth: 600, width: '100%', alignSelf: 'center' },
  gridSize: { color: colors.heading, fontSize: 25, paddingLeft: 20 },
  row: { flexDirection: 'row' },
  rowText: { flex: 1, color: colors.heading, fontSize: 18 },
  rowLabel: { textAlign: 'center' },
  rowValue: { textAlign: 'right' },
});
