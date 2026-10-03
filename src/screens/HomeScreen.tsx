import React from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoundButton } from '../components/RoundButton';
import { colors } from '../theme/colors';

interface Props {
  onPlay: () => void;
  onBestTimes: () => void;
  onSettings: () => void;
}

export function HomeScreen({ onPlay, onBestTimes, onSettings }: Props) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const logoSize = Math.min(landscape ? height * 0.6 : width - 40, height * 0.4, 420);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.content, landscape && styles.contentLandscape]}>
        <View style={styles.hero}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: logoSize, height: logoSize }} resizeMode="contain" />
          <Text style={styles.tagline}>flex your vocabulary!</Text>
        </View>

        <View style={styles.buttons}>
          <RoundButton source={require('../../assets/images/ic_table.png')} size={80} onPress={onBestTimes} accessibilityLabel="Best times" />
          <RoundButton source={require('../../assets/images/ic_start.png')} size={100} onPress={onPlay} accessibilityLabel="Start game" />
          <RoundButton source={require('../../assets/images/ic_setting.png')} size={80} onPress={onSettings} accessibilityLabel="Settings" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 10 },
  contentLandscape: { flexDirection: 'row', alignItems: 'center' },
  hero: { flex: 1.3, alignItems: 'center', justifyContent: 'center' },
  tagline: { color: colors.iceberg, fontSize: 24, textAlign: 'center', marginTop: 5 },
  buttons: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
});
