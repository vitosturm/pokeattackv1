'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './HeroStage.css';
import './SiteNav.css';
import { HeroTeamPanel } from './HeroTeamPanel';
import { HeroLeaderboardPanel } from './HeroLeaderboardPanel';
import { DesignModeSwitch } from './DesignModeSwitch';
import type { LeaderboardRow, LeaderboardSummary } from '@/app/actions/leaderboard';

interface HeroStageProps {
  topRows: LeaderboardRow[];
  summary: LeaderboardSummary;
}

export function HeroStage({ topRows, summary }: HeroStageProps) {
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
          <DesignModeSwitch />
          <Link href="/battle" className="cta-nav">
            Play now
          </Link>
        </div>
      </div>

      {/* Stage */}
      <div className="stage">
        <div className="stage-left">
          <HeroTeamPanel />
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
          <HeroLeaderboardPanel topRows={topRows} summary={summary} />
        </div>
      </div>
    </div>
  );
}
