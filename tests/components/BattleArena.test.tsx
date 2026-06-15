import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BattleArena } from '@/components/BattleArena';
import type { PokemonSummary, Move } from '@/lib/types';

const mk = (id: number, name: string, type: 'fire' | 'water'): PokemonSummary => ({
  id, name, types: [type],
  stats: { hp: 100, attack: 80, defense: 70, specialAttack: 80, specialDefense: 70, speed: 60 },
  sprite: 'x',
});

const team = [mk(1, 'pa', 'water'), mk(2, 'pb', 'water'), mk(3, 'pc', 'water')];
const opp  = [mk(4, 'oa', 'fire'),  mk(5, 'ob', 'fire'),  mk(6, 'oc', 'fire')];
const moves: Move[] = [
  { id: 1, name: 'splash', type: 'water', power: 80, pp: 10, damageClass: 'special' },
  { id: 2, name: 'tackle', type: 'water', power: 40, pp: 35, damageClass: 'physical' },
];
const oppMoves: Move[] = [
  { id: 9, name: 'burn', type: 'fire', power: 70, pp: 10, damageClass: 'special' },
];

describe('BattleArena', () => {
  it('renders both active Pokémon and four moves', () => {
    render(<BattleArena team={team} opponents={opp} playerMoves={moves} opponentMoves={oppMoves} />);
    expect(screen.getByText(/pa/)).toBeInTheDocument();
    expect(screen.getByText(/oa/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /splash/i })).toBeInTheDocument();
  });

  it('reduces opponent HP when a move is clicked', async () => {
    render(<BattleArena team={team} opponents={opp} playerMoves={moves} opponentMoves={oppMoves} />);
    const initialOppHp = screen.getAllByText('100 / 100');
    await userEvent.click(screen.getByRole('button', { name: /splash/i }));
    expect(screen.queryAllByText('100 / 100').length).toBeLessThan(initialOppHp.length);
  });
});
