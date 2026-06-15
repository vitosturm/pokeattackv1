import { getTopScores } from '@/app/actions/leaderboard';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const rows = await getTopScores(50);
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Leaderboard</h1>
      <table className="w-full text-sm">
        <thead className="text-white/60">
          <tr>
            <th className="text-left">#</th>
            <th className="text-left">Player</th>
            <th>Score</th>
            <th>Wins</th>
            <th>Battles</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-white/10">
              <td className="py-2">{i + 1}</td>
              <td>{r.playerName}</td>
              <td className="text-center">{r.score}</td>
              <td className="text-center">{r.wins}</td>
              <td className="text-center">{r.battles}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
