'use client';

import { useRouter } from 'next/navigation';
import type { LeaderboardRow, LeaderboardSummary } from '@/app/actions/leaderboard';
import { GbDevice } from './GbDevice';

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
    <GbDevice side="right">
      <div className="hero-panel hero-panel-right">
        <div className="hero-panel-head">
          <span className="gb-caret">▸</span>
          <span>Top Trainers</span>
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
              <span>{summary.players} trainers</span>
              <span className="lb-dot">·</span>
              <span>{summary.battles} battles</span>
            </div>

            <button className="btn ghost" onClick={() => router.push('/leaderboard')}>
              Leaderboard →
            </button>
          </>
        ) : (
          <div className="lb-empty">
            <p>No scores yet — be the first to claim #1.</p>
            <button className="btn primary" onClick={() => router.push('/battle')}>
              Start battle →
            </button>
          </div>
        )}

        <div className="live-row">
          <span className="press-start">PRESS START</span>
          <span className="pulse-dot" />
        </div>
      </div>
    </GbDevice>
  );
}
