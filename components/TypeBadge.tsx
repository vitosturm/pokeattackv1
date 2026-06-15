import { cn } from '@/lib/utils';
import type { PokemonType } from '@/lib/type-chart';

const COLORS: Record<PokemonType, string> = {
  normal: 'bg-[#a8a878]',
  fire: 'bg-[#f08030]',
  water: 'bg-[#6890f0]',
  electric: 'bg-[#f8d030] text-black',
  grass: 'bg-[#78c850]',
  ice: 'bg-[#98d8d8] text-black',
  fighting: 'bg-[#c03028]',
  poison: 'bg-[#a040a0]',
  ground: 'bg-[#e0c068] text-black',
  flying: 'bg-[#a890f0]',
  psychic: 'bg-[#f85888]',
  bug: 'bg-[#a8b820]',
  rock: 'bg-[#b8a038]',
  ghost: 'bg-[#705898]',
  dragon: 'bg-[#7038f8]',
  dark: 'bg-[#705848]',
  steel: 'bg-[#b8b8d0] text-black',
  fairy: 'bg-[#ee99ac] text-black',
};

export function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs uppercase font-semibold text-white',
        COLORS[type],
      )}
    >
      {type}
    </span>
  );
}
