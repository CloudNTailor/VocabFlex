import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

/**
 * Text button (the original's custom_button). Light by default, for the iceberg
 * pause overlay; `filled` is for screens that already use the light background.
 */
export function MenuButton({ label, onPress, filled }: { label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, filled && { backgroundColor: colors.iceberg }, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.text, filled && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  text: { color: colors.letter, fontSize: 16, textTransform: 'uppercase', fontWeight: '500' },
});
