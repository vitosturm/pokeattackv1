'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './HeroStage.css';
import './SiteNav.css';

export function HeroStage() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const triggeredRef = useRef(false);

  function launchBattle() {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    setLaunching(true);
    // Total animation ~900ms: ball wobbles+opens (450ms) → flash blooms (300ms) → navigate
    window.setTimeout(() => {
      router.push('/battle');
    }, 850);
  }

  return (
    <div className="hero-stage relative h-[820px] overflow-hidden">
      {/* Nav */}
      <div className="nav-bar">
        <Link href="/" className="logo">
          POKEATTACK
        </Link>
        <div className="nav-items">
          <Link href="/">Home</Link>
          <Link href="/pokedex">Pokedex</Link>
          <Link href="/roster">My Pokemons</Link>
          <Link href="/battle">Battle</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/battle" className="cta-nav">
            Play now
          </Link>
        </div>
      </div>

      {/* Stage */}
      <div className="stage">
        <div className="stage-left">
          <span className="gb-led" />
          <div className="gb-screen">
            <div className="panel-head">
              <span className="dot-status" />
              <span>Mission · Vol.01 — 2026</span>
            </div>
            <h2>
              Train.
              <br />
              Battle.
              <br />
              <em>Conquer.</em>
            </h2>
            <p>Build a team of three. Master 18 types. Climb the board.</p>
            <div className="cta-row">
              <button className="btn primary" onClick={() => router.push('/battle')}>
                Start →
              </button>
              <button className="btn ghost" onClick={() => router.push('/pokedex')}>
                Pokedex
              </button>
            </div>
          </div>
        </div>

        <div className="center-stage">
          <div
            className={`pokeball-wrap ${launching ? 'launching' : ''}`}
            role="button"
            tabIndex={0}
            onClick={launchBattle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') launchBattle();
            }}
            aria-label="Play now — go to battle"
          >
            <div className="ring-glow" />
            <div className="pokeball-main">
              <div className="ball" />
              <div className="ball-top-half" />
              <div className="ball-bottom-half" />
              <div className="ball-core-flash" />
              <div className="highlight" />
            </div>
            <div className="pokeball-cta">Play now — Battle</div>
          </div>
          {launching && <div className="page-flash" />}
        </div>

        <div className="stage-right">
          <span className="gb-led" />
          <div className="gb-screen">
            <div className="panel-head">
              <span>Leaderboard · Live ranking</span>
              <span className="dot-status red" />
            </div>
            <h2>
              151
              <br />
              Pokémon.
              <br />
              <em>Endless</em>
              <br />
              battles.
            </h2>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-num">18</div>
                <div className="stat-lbl">Types</div>
              </div>
              <div className="stat">
                <div className="stat-num">3v3</div>
                <div className="stat-lbl">Battles</div>
              </div>
              <div className="stat">
                <div className="stat-num">∞</div>
                <div className="stat-lbl">Replays</div>
              </div>
            </div>
            <div className="live-row">
              <span>Live now</span>
              <span className="pulse-dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
