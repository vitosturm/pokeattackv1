'use client';

import { useRoster } from '@/hooks/useRoster';
import { PokemonCard } from '@/components/PokemonCard';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function RosterPage() {
  const { roster, remove, clear } = useRoster();
  const router = useRouter();

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Roster ({roster.length}/6)</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={clear} disabled={!roster.length}>
            Clear
          </Button>
          <Button onClick={() => router.push('/battle')} disabled={roster.length < 3}>
            Start battle
          </Button>
        </div>
      </header>
      {roster.length === 0 ? (
        <p className="text-white/60">Visit any Pokémon page and add it to your roster.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {roster.map((p) => (
            <div key={p.id} className="relative">
              <PokemonCard pokemon={p} />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(p.id)}
                className="absolute top-2 right-2"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
