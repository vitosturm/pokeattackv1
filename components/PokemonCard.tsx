'use client';

import type { PokemonSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { HoloCard } from '@/components/HoloCard';
import { TCG_CARD_IMAGE } from '@/lib/tcg-cards';

interface Props {
  pokemon: PokemonSummary;
  onAdd?: (p: PokemonSummary) => void;
}

export function PokemonCard({ pokemon, onAdd }: Props) {
  return (
    <HoloCard
      pokemon={pokemon}
      imageSrc={pokemon.sprite}
      tcgImageUrl={TCG_CARD_IMAGE[pokemon.id]}
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
