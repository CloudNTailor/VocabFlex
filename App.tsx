import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBackHandler } from './src/components/useBackHandler';
import { WordSourceProvider } from './src/db/WordSourceProvider';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from './src/game/storage';
import { BestTimesScreen } from './src/screens/BestTimesScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';

type Screen = 'home' | 'game' | 'bestTimes' | 'settings';

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.timer} size="large" />
    </View>
  );
}

function Root() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  // The other screens handle back themselves; on home, let Android close the app.
  useBackHandler(() => false);

  if (!loaded) return <Loading />;

  const goHome = () => setScreen('home');

  switch (screen) {
    case 'game':
      return <GameScreen settings={settings} onExit={goHome} />;
    case 'bestTimes':
      return <BestTimesScreen onBack={goHome} />;
    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          onChange={(next) => {
            setSettings(next);
            saveSettings(next);
          }}
          onBack={goHome}
        />
      );
    default:
      return <HomeScreen onPlay={() => setScreen('game')} onBestTimes={() => setScreen('bestTimes')} onSettings={() => setScreen('settings')} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WordSourceProvider fallback={<Loading />}>
        <Root />
      </WordSourceProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
