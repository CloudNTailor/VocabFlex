import { createAudioPlayer, AudioPlayer } from 'expo-audio';

type SoundName = 'wordFound' | 'boardFinished';

const SOURCES = {
  wordFound: require('../../assets/sounds/word_found.mp3'),
  boardFinished: require('../../assets/sounds/board_finished.mp3'),
};

const players: Partial<Record<SoundName, AudioPlayer>> = {};

/** Plays a short effect. Sound is decoration, so failures are swallowed. */
export function playSound(name: SoundName): void {
  try {
    const player = (players[name] ??= createAudioPlayer(SOURCES[name]));
    player.seekTo(0);
    player.play();
  } catch {
    // ignore
  }
}
