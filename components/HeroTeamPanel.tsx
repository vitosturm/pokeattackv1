'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useRoster, MAX_ROSTER } from '@/hooks/useRoster';
import { spriteUrl } from '@/lib/pokeapi';

const noop = () => () => {};

export function HeroTeamPanel() {
  const router = useRouter();
  const { roster } = useRoster();
  // roster comes from localStorage — empty during SSR, so gate the dynamic parts
  // until hydration to avoid a mismatch. useSyncExternalStore returns the server
  // snapshot (false) on the server and during the first client render, then true.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const count = mounted ? roster.length : 0;
  const slots = Array.from({ length: MAX_ROSTER }, (_, i) => (mounted ? roster[i] : undefined));

  const cta =
    count >= 3
      ? { label: 'Battle starten →', onClick: () => router.push('/battle') }
      : count > 0
        ? { label: 'Weiter wählen →', onClick: () => router.push('/pokedex') }
        : { label: 'Starter wählen →', onClick: () => router.push('/pokedex') };

  return (
    <div className="hero-panel">
      <div className="hero-panel-head">
        <span className="dot-status" />
        <span>Mission · Dein Team</span>
      </div>

      <h2 className="hero-panel-title">
        Train.
        <br />
        Battle.
        <br />
        <em>Conquer.</em>
      </h2>

      <div className="team-slots">
        {slots.map((p, i) => (
          <div key={i} className={`team-slot ${p ? 'filled' : ''}`}>
            {p ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={spriteUrl(p.id)} alt={p.name} loading="lazy" />
            ) : (
              <span className="team-slot-plus">+</span>
            )}
          </div>
        ))}
      </div>

      <div className="team-progress">
        <span className="team-progress-label">
          {count}/{MAX_ROSTER} gewählt
        </span>
        <div className="team-progress-track">
          <div className="team-progress-fill" style={{ width: `${(count / MAX_ROSTER) * 100}%` }} />
        </div>
      </div>

      <button className="btn primary" onClick={cta.onClick}>
        {cta.label}
      </button>
    </div>
  );
}
