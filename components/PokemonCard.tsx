'use client';

import type { PokemonSummary } from '@/lib/types';
import { TypeBadge } from './TypeBadge';
import { padId } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  pokemon: PokemonSummary;
  onAdd?: (p: PokemonSummary) => void;
}

export function PokemonCard({ pokemon, onAdd }: Props) {
  return (
    <Card className="p-4 flex flex-col items-center gap-2 bg-[#14141f] border-white/10">
      <span className="text-xs text-white/60 self-start font-mono">#{padId(pokemon.id)}</span>
      <img src={pokemon.sprite} alt={pokemon.name} className="w-32 h-32 object-contain" />
      <span className="text-lg font-semibold capitalize">{pokemon.name}</span>
      <div className="flex gap-1">
        {pokemon.types.map((t) => <TypeBadge key={t} type={t} />)}
      </div>
      {onAdd && (
        <Button onClick={() => onAdd(pokemon)} className="mt-2 w-full">
          Add to roster
        </Button>
      )}
    </Card>
  );
}
