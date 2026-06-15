import { getPokemon, GEN1_IDS } from '@/lib/pokeapi';
import { SiteNav } from '@/components/SiteNav';
import { PokedexGrid } from '@/components/PokedexGrid';

export const revalidate = 86400;

export default async function PokedexPage() {
  const all = await Promise.all(GEN1_IDS.map((id) => getPokemon(id)));

  return (
    <>
      <SiteNav />
      <main className="max-w-6xl mx-auto p-6">
        <header className="mb-6">
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: 'Bangers, Impact, sans-serif', letterSpacing: '0.04em' }}
          >
            POKÉDEX
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Browse the 151 original Pokémon. Add up to 6 to your roster.
          </p>
        </header>
        <PokedexGrid all={all} />
      </main>
    </>
  );
}
