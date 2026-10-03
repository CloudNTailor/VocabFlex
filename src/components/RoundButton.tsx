import React from 'react';
import { Image, ImageSourcePropType, Pressable } from 'react-native';

interface Props {
  source: ImageSourcePropType;
  size: number;
  onPress: () => void;
  accessibilityLabel: string;
}

/** Round icon button, like the original's CircleButton. */
export function RoundButton({ source, size, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
    </Pressable>
  );
}
