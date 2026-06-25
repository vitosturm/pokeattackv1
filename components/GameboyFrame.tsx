'use client';

import { useMuted } from '@/hooks/useMuted';
import { toggleMuted } from '@/lib/muteState';
import './GameboyFrame.css';

interface Props {
  children: React.ReactNode;
}

export function GameboyFrame({ children }: Props) {
  const muted = useMuted();

  return (
    <div className="gb-shell">
      <div className="gb-shell__top">
        <div className="gb-led" aria-hidden="true" />
        <span className="gb-shell__brand">GAMEBOY</span>
      </div>

      <div className="gb-screen-bezel">
        <div className="gb-screen">
          {children}
          <div className="gb-screen__overlay" aria-hidden="true" />
        </div>
      </div>

      <div className="gb-controls">
        <div className="gb-dpad" aria-hidden="true">
          <span className="gb-dpad__h" />
          <span className="gb-dpad__v" />
        </div>
        <div className="gb-ab" aria-hidden="true">
          <span className="gb-ab__button">B</span>
          <span className="gb-ab__button">A</span>
        </div>
      </div>

      <div className="gb-meta">
        <div className="gb-meta__button-group">
          <button
            type="button"
            className="gb-meta__pill gb-meta__mute-btn"
            onClick={toggleMuted}
            aria-label={muted ? 'Unmute' : 'Mute'}
          />
          <span className="gb-meta__label">{muted ? '🔇 MUTE' : '🔊 SELECT'}</span>
        </div>
        <div className="gb-meta__button-group">
          <span className="gb-meta__pill" aria-hidden="true" />
          <span className="gb-meta__label">START</span>
        </div>
      </div>

      <div className="gb-speaker" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
