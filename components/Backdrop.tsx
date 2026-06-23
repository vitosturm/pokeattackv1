'use client';

import { useDesignMode } from '@/hooks/useDesignMode';
import { AnimatedBackdrop } from './AnimatedBackdrop';
import { VideoBackdrop } from './VideoBackdrop';

export function Backdrop() {
  const { mode } = useDesignMode();
  return mode === 'video' ? <VideoBackdrop /> : <AnimatedBackdrop />;
}
