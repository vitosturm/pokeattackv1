'use client';

import { useDesignMode } from '@/hooks/useDesignMode';
import { AnimatedBackdrop } from './AnimatedBackdrop';
import { VideoBackdrop } from './VideoBackdrop';

export function Backdrop() {
  const { mode } = useDesignMode();
  if (mode === 'video') {
    return (
      <>
        <VideoBackdrop />
        {/* Bouncing pokeballs float on top of the video (z-index -1 > video's -10) */}
        <AnimatedBackdrop ballsOnly />
      </>
    );
  }
  return <AnimatedBackdrop />;
}
