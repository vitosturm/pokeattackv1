import type { ReactNode } from 'react';

interface GbDeviceProps {
  /** Which side of the stage — mirrors the controls so they face the centre. */
  side: 'left' | 'right';
  children: ReactNode;
}

/**
 * Presentational Game Boy (DMG-01) shell: grey casing + green dot-matrix screen
 * holding `children`, plus decorative controls (D-pad, A/B, Start/Select) and the
 * GAME BOY brand. Controls are purely cosmetic (aria-hidden, no pointer events) —
 * the real CTA lives inside the screen content.
 */
export function GbDevice({ side, children }: GbDeviceProps) {
  return (
    <div className={`gb-device gb-device--${side}`}>
      <div className="gb-screen-frame">
        <div className="gb-screen">{children}</div>
      </div>

      <div className="gb-brand" aria-hidden="true">
        <span className="gb-brand-nintendo">Nintendo</span>
        <span className="gb-brand-name">
          GAME BOY<span className="gb-brand-tm">™</span>
        </span>
      </div>

      <div className="gb-controls" aria-hidden="true">
        <div className="gb-dpad">
          <span className="gb-dpad-v" />
          <span className="gb-dpad-h" />
          <span className="gb-dpad-center" />
        </div>
        <div className="gb-ab">
          <span className="gb-btn gb-btn-b">B</span>
          <span className="gb-btn gb-btn-a">A</span>
        </div>
        <div className="gb-startselect">
          <span className="gb-pill" />
          <span className="gb-pill" />
        </div>
      </div>
    </div>
  );
}
