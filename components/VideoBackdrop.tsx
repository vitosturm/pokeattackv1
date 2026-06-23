'use client';

import { useEffect, useRef, useState } from 'react';
import { BACKGROUND_VIDEOS } from '@/lib/backgroundVideos';

export function VideoBackdrop() {
  const [src] = useState(
    () => BACKGROUND_VIDEOS[Math.floor(Math.random() * BACKGROUND_VIDEOS.length)],
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) videoRef.current?.pause();
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0f]">
      <video
        ref={videoRef}
        key={src}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Dark scrim so foreground text stays legible over bright footage. */}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}
