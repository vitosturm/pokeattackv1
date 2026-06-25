'use client';

import { useCallback, useRef } from 'react';
import { isMuted } from '@/lib/muteState';

export function useSound(src?: string, volume = 0.4) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSrcRef = useRef<string | undefined>(undefined);

  const play = useCallback(
    (overrideSrc?: string) => {
      if (typeof window === 'undefined') return;
      if (isMuted()) return;
      const url = overrideSrc ?? src;
      if (!url) return;
      if (!audioRef.current || lastSrcRef.current !== url) {
        audioRef.current = new Audio(url);
        audioRef.current.volume = volume;
        lastSrcRef.current = url;
      }
      audioRef.current.currentTime = 0;
      const result = audioRef.current.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          /* silently ignore missing files / autoplay blocks */
        });
      }
    },
    [src, volume],
  );

  return play;
}
