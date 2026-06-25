'use client';

import { useEffect, useState } from 'react';
import { isMuted, subscribeMuted } from '@/lib/muteState';

export function useMuted(): boolean {
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => {
    return subscribeMuted(() => setMutedState(isMuted()));
  }, []);

  return muted;
}
