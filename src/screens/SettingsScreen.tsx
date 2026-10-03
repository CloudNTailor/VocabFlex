import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBackHandler } from '../components/useBackHandler';
import { LANGUAGES } from '../db/languages';
import { Settings, WORD_COUNT_OPTIONS } from '../game/storage';
import { GRID_SIZES } from '../game/types';
import { colors, PENCIL_COLORS } from '../theme/colors';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onBack: () => void;
}

interface Choice {
  value: string;
  label: string;
}

type ChoiceKey = 'language' | 'gridSize' | 'wordCount';

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  const [picking, setPicking] = useState<ChoiceKey | null>(null);
  useBackHandler(() => {
    if (picking) setPicking(null);
    else onBack();
    return true;
  });

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });

  const choices: Record<ChoiceKey, { title: string; options: Choice[]; current: string }> = {
    language: {
      title: 'Language',
      options: LANGUAGES.map((l) => ({ value: l.code, label: l.label })),
      current: settings.language,
    },
    gridSize: {
      title: 'Grid size',
      options: GRID_SIZES.map((n) => ({ value: String(n), label: `${n}x${n}` })),
      current: String(settings.gridSize),
    },
    wordCount: {
      title: 'Random word count',
      options: WORD_COUNT_OPTIONS.map((n) => ({ value: String(n), label: String(n) })),
      current: String(settings.wordCount),
    },
  };

  const labelFor = (key: ChoiceKey) => choices[key].options.find((o) => o.value === choices[key].current)?.label ?? '';

  const pick = (key: ChoiceKey, value: string) => {
    if (key === 'language') set('language', value as Settings['language']);
    else if (key === 'gridSize') set('gridSize', Number(value));
    else set('wordCount', Number(value));
    setPicking(null);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <ChoiceRow title="Language" summary="Select language for word list" value={labelFor('language')} onPress={() => setPicking('language')} />
        <ChoiceRow title="Grid size" summary="Number of rows and columns on the grid" value={labelFor('gridSize')} onPress={() => setPicking('gridSize')} />
        <SwitchRow title="Allow substring" summary="Allow word in word or not" value={settings.allowSubstring} onChange={(v) => set('allowSubstring', v)} />
        <SwitchRow title="Keep device awake" summary="Keep device awake while playing" value={settings.keepAwake} onChange={(v) => set('keepAwake', v)} />
        <SwitchRow
          title="Constant pencil color"
          summary="Determines if found word pencil color is random or same"
          value={settings.constantPencilColor}
          onChange={(v) => set('constantPencilColor', v)}
        />
        <View style={[styles.row, !settings.constantPencilColor && styles.disabled]}>
          <Text style={styles.rowTitle}>Pencil color</Text>
          <Text style={styles.rowSummary}>Change pencil color</Text>
          <View style={styles.swatches}>
            {PENCIL_COLORS.map((c) => (
              <Pressable
                key={c}
                disabled={!settings.constantPencilColor}
                onPress={() => set('pencilColor', c)}
                accessibilityRole="button"
                accessibilityLabel={`Pencil color ${c}`}
                style={[styles.swatch, { backgroundColor: c }, settings.pencilColor.toUpperCase() === c && styles.swatchSelected]}
              />
            ))}
          </View>
        </View>
        <SwitchRow title="Rounded pencil" summary="Square or rounded pencil" value={settings.roundedPencil} onChange={(v) => set('roundedPencil', v)} />
        <SwitchRow title="Sound" summary="Sound On or Off" value={settings.sound} onChange={(v) => set('sound', v)} />
        <ChoiceRow
          title="Random word count"
          summary="Number of random words to select from database"
          value={labelFor('wordCount')}
          onPress={() => setPicking('wordCount')}
        />
      </ScrollView>

      <Modal visible={picking !== null} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(null)}>
          {picking && (
            <Pressable style={styles.dialog} onPress={() => {}}>
              <Text style={styles.dialogTitle}>{choices[picking].title}</Text>
              <ScrollView>
                {choices[picking].options.map((o) => {
                  const selected = o.value === choices[picking].current;
                  return (
                    <Pressable key={o.value} onPress={() => pick(picking, o.value)} style={styles.option} accessibilityRole="button">
                      <Text style={[styles.optionText, selected && styles.optionSelected]}>{(selected ? '● ' : '○ ') + o.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function ChoiceRow({ title, summary, value, onPress }: { title: string; summary: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSummary}>{summary}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </Pressable>
  );
}

function SwitchRow({ title, summary, value, onChange }: { title: string; summary: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[styles.row, styles.switchRow]}>
      <View style={styles.switchText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSummary}>{summary}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.iceberg, false: '#B8C0BE' }} thumbColor={value ? colors.heading : '#F4F4F4'} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 10 },
  back: { width: 40, color: colors.heading, fontSize: 40 },
  title: { flex: 1, color: colors.heading, fontSize: 28, textAlign: 'center', padding: 10 },
  list: { paddingBottom: 30, maxWidth: 600, width: '100%', alignSelf: 'center' },
  row: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C9D0CE' },
  disabled: { opacity: 0.4 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchText: { flex: 1, paddingRight: 12 },
  rowTitle: { color: colors.letter, fontSize: 18 },
  rowSummary: { color: colors.grey, fontSize: 14, marginTop: 2 },
  rowValue: { color: colors.heading, fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: colors.letter },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: colors.background, borderRadius: 10, width: '100%', maxWidth: 360, maxHeight: '80%', paddingVertical: 12 },
  dialogTitle: { color: colors.heading, fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, paddingBottom: 8 },
  option: { paddingHorizontal: 20, paddingVertical: 12 },
  optionText: { color: colors.letter, fontSize: 17 },
  optionSelected: { color: colors.heading, fontWeight: 'bold' },
});
