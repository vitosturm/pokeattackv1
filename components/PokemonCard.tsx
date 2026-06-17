'use client';

import type { PokemonSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { HoloCard } from '@/components/HoloCard';

interface Props {
  pokemon: PokemonSummary;
  onAdd?: (p: PokemonSummary) => void;
}

export function PokemonCard({ pokemon, onAdd }: Props) {
  return (
    <HoloCard
      pokemon={pokemon}
      imageSrc={pokemon.sprite}
      footer={
        onAdd ? (
          <Button onClick={() => onAdd(pokemon)} size="sm" className="mt-1 w-full">
            Add to roster
          </Button>
        ) : undefined
      }
    />
  );
}
