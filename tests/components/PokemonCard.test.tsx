import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PokemonCard } from '@/components/PokemonCard';
import type { PokemonSummary } from '@/lib/types';

const p: PokemonSummary = {
  id: 25,
  name: 'pikachu',
  types: ['electric'],
  stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  sprite: 'x.png',
};

describe('PokemonCard', () => {
  it('renders name, id and type', () => {
    render(<PokemonCard pokemon={p} />);
    expect(screen.getByText(/pikachu/i)).toBeInTheDocument();
    expect(screen.getByText(/#025/)).toBeInTheDocument();
    expect(screen.getByText(/electric/i)).toBeInTheDocument();
  });

  it('calls onAdd when the Add button is clicked', async () => {
    const onAdd = vi.fn();
    render(<PokemonCard pokemon={p} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: /add to roster/i }));
    expect(onAdd).toHaveBeenCalledWith(p);
  });
});
