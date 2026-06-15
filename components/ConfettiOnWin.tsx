'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function ConfettiOnWin({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return;
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
  }, [trigger]);
  return null;
}
