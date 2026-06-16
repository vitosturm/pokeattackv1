'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './HeroStage.css';

export function HeroStage() {
  const router = useRouter();

  return (
    <div className="hero-stage relative h-[820px] overflow-hidden">
      {/* Nav */}
      <div className="nav-bar">
        <Link href="/" className="logo">
          POKEATTACK
        </Link>
        <div className="nav-items">
          <Link href="/">Home</Link>
          <Link href="/roster">Roster</Link>
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
              <button className="btn ghost" onClick={() => router.push('/pokemon/1')}>
                Pokédex
              </button>
            </div>
          </div>
        </div>

        <div className="center-stage">
          <div
            className="pokeball-wrap"
            role="button"
            tabIndex={0}
            onClick={() => router.push('/battle')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') router.push('/battle');
            }}
            aria-label="Play now — go to battle"
          >
            <div className="ring-glow" />
            <div className="pokeball-main">
              <div className="ball" />
              <div className="highlight" />
            </div>
            <div className="pokeball-cta">Play now — Battle</div>
          </div>
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
