'use client';

import { useRouter } from 'next/navigation';
import type { LeaderboardRow, LeaderboardSummary } from '@/app/actions/leaderboard';

const RANK_COLOR = ['#ffd14a', '#c8c8c8', '#cd7f32'];
const MEDAL = ['🥇', '🥈', '🥉'];

interface Props {
  topRows: LeaderboardRow[];
  summary: LeaderboardSummary;
}

export function HeroLeaderboardPanel({ topRows, summary }: Props) {
  const router = useRouter();
  const hasScores = topRows.length > 0;

  return (
    <div className="hero-panel hero-panel-right">
      <div className="hero-panel-head">
        <span>Leaderboard · Live</span>
        <span className="dot-status red" />
      </div>

      {hasScores ? (
        <>
          <ul className="lb-rows">
            {topRows.slice(0, 3).map((r, i) => (
              <li key={r.id} className="lb-row">
                <span className="lb-rank" style={{ color: RANK_COLOR[i] }}>
                  {MEDAL[i]}
                </span>
                <span className="lb-name">{r.playerName}</span>
                <span className="lb-score">{r.score}</span>
              </li>
            ))}
          </ul>

          <div className="lb-summary">
            <span>{summary.players} Trainer</span>
            <span className="lb-dot">·</span>
            <span>{summary.battles} Battles</span>
          </div>

          <button className="btn ghost" onClick={() => router.push('/leaderboard')}>
            Bestenliste →
          </button>
        </>
      ) : (
        <div className="lb-empty">
          <p>Noch keine Scores — sei der Erste an der Spitze.</p>
          <button className="btn primary" onClick={() => router.push('/battle')}>
            Battle starten →
          </button>
        </div>
      )}

      <div className="live-row">
        <span>Live now</span>
        <span className="pulse-dot" />
      </div>
    </div>
  );
}
