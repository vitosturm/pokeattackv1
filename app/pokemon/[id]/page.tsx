import { notFound } from 'next/navigation';
import { getPokemon } from '@/lib/pokeapi';
import { PokemonCard } from '@/components/PokemonCard';
import { StatRadar } from '@/components/StatRadar';
import { StatGrid } from '@/components/StatGrid';
import { TypeBadge } from '@/components/TypeBadge';
import { SiteNav } from '@/components/SiteNav';

interface Params {
  id: string;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1 || n > 151) notFound();

  const p = await getPokemon(n);

  return (
    <>
      <SiteNav />
      <main className="max-w-4xl mx-auto p-6 grid gap-6 md:grid-cols-2">
        <PokemonCard pokemon={p} />
        <section>
          <h1 className="text-3xl capitalize mb-2">{p.name}</h1>
          <div className="flex gap-2 mb-4">
            {p.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <StatRadar pokemon={p} />
          <StatGrid pokemon={p} />
        </section>
      </main>
    </>
  );
}
