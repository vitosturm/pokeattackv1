'use client';

import { useCallback, useRef } from 'react';

export function useSound(src: string, volume = 0.4) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.volume = volume;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      /* silently ignore missing files / autoplay blocks */
    });
  }, [src, volume]);

  return play;
}
