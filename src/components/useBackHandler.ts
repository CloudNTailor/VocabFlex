import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/** Runs `handler` on the Android back button; return true to consume it. */
export function useBackHandler(handler: () => boolean): void {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => latest.current());
    return () => subscription.remove();
  }, []);
}
