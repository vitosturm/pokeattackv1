import Link from 'next/link';
import { getTopScores } from '@/app/actions/leaderboard';
import './glass-card.css';

export async function HomeLeaderboardPreview() {
  let rows: Awaited<ReturnType<typeof getTopScores>> = [];
  try {
    rows = await getTopScores(5);
  } catch {
    rows = [];
  }

  return (
    <section className="py-20 px-14 md:px-20">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h2
            className="text-4xl mb-2"
            style={{
              fontFamily: 'Bangers, Impact, sans-serif',
              letterSpacing: '0.04em',
              textShadow: '2px 2px 0 #1a1a1a, 3px 3px 0 rgba(255,56,96,0.55)',
            }}
          >
            Top trainers
          </h2>
          <p className="text-white/60 text-sm">
            Live ranking — climb the board by winning battles.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="text-[10px] uppercase font-bold text-[#ff3860] hover:underline"
          style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
        >
          Full leaderboard →
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="glass-panel rounded-lg py-12 text-center">
          <p className="text-white/70 mb-3">No scores yet — be the first to claim #1.</p>
          <Link
            href="/battle"
            className="inline-block bg-[#ff3860] hover:opacity-90 px-6 py-2 rounded-full text-sm font-bold"
            style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.08em' }}
          >
            Battle now
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r, i) => (
            <div key={r.id} className="glass-panel rounded-lg p-4 flex items-center gap-4">
              <span
                className="text-2xl w-10 text-center"
                style={{
                  fontFamily: 'Bangers, Impact, sans-serif',
                  color:
                    i === 0 ? '#ffd14a' : i === 1 ? '#c8c8c8' : i === 2 ? '#cd7f32' : '#ffffff',
                }}
              >
                #{i + 1}
              </span>
              <span className="flex-1 capitalize font-semibold">{r.playerName}</span>
              <span className="text-sm text-white/60">
                {r.wins} W / {r.battles} B
              </span>
              <span
                className="text-2xl text-[#ff3860]"
                style={{ fontFamily: 'Bangers, Impact, sans-serif' }}
              >
                {r.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
