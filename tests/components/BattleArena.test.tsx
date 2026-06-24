import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BattleArena } from '@/components/BattleArena';
import type { PokemonSummary, Move } from '@/lib/types';

const mk = (id: number, name: string, type: 'fire' | 'water'): PokemonSummary => ({
  id,
  name,
  types: [type],
  stats: { hp: 100, attack: 80, defense: 70, specialAttack: 80, specialDefense: 70, speed: 60 },
  sprite: 'x',
});

const team = [mk(1, 'pa', 'water'), mk(2, 'pb', 'water'), mk(3, 'pc', 'water')];
const opp = [mk(4, 'oa', 'fire'), mk(5, 'ob', 'fire'), mk(6, 'oc', 'fire')];
const moves: Move[] = [
  { id: 1, name: 'splash', type: 'water', power: 80, pp: 10, damageClass: 'special' },
  { id: 2, name: 'tackle', type: 'water', power: 40, pp: 35, damageClass: 'physical' },
];
const oppMoves: Move[] = [
  { id: 9, name: 'burn', type: 'fire', power: 70, pp: 10, damageClass: 'special' },
];

const playerMovesById: Record<number, Move[]> = { 1: moves, 2: moves, 3: moves };
const oppMovesById: Record<number, Move[]> = { 4: oppMoves, 5: oppMoves, 6: oppMoves };

describe('BattleArena', () => {
  it('renders both active Pokémon and four moves', () => {
    render(
      <BattleArena
        team={team}
        opponents={opp}
        playerMoves={playerMovesById}
        opponentMoves={oppMovesById}
      />,
    );
    expect(screen.getByText(/pa/)).toBeInTheDocument();
    expect(screen.getByText(/oa/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /splash/i })).toBeInTheDocument();
  });

  it('reduces opponent HP when a move is clicked', async () => {
    render(
      <BattleArena
        team={team}
        opponents={opp}
        playerMoves={playerMovesById}
        opponentMoves={oppMovesById}
      />,
    );
    const initialOppHp = screen.getAllByText('100 / 100');
    await userEvent.click(screen.getByRole('button', { name: /splash/i }));
    expect(screen.queryAllByText('100 / 100').length).toBeLessThan(initialOppHp.length);
  });

  it('forces a Pokémon switch when the active Pokémon faints, hiding move buttons until one is chosen', async () => {
    const fragileTeam = [{ ...team[0], stats: { ...team[0].stats, hp: 1 } }, team[1], team[2]];
    render(
      <BattleArena
        team={fragileTeam}
        opponents={opp}
        playerMoves={playerMovesById}
        opponentMoves={oppMovesById}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /splash/i }));
    expect(screen.queryByRole('button', { name: /splash/i })).not.toBeInTheDocument();
    expect(screen.getByText(/fainted! choose your next/i)).toBeInTheDocument();
  });

  it('renders the battle log after a move is used', async () => {
    render(
      <BattleArena
        team={team}
        opponents={opp}
        playerMoves={playerMovesById}
        opponentMoves={oppMovesById}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /splash/i }));
    expect(screen.getByText(/used splash/i)).toBeInTheDocument();
  });

  it('shows a status icon next to the opponent once they are burned', async () => {
    const burnMove: Move = {
      id: 3,
      name: 'inferno',
      type: 'fire',
      power: 40,
      pp: 10,
      damageClass: 'special',
      ailment: 'burn',
      ailmentChance: 100,
    };
    const playerMovesWithBurn: Record<number, Move[]> = {
      1: [...moves, burnMove],
      2: [...moves, burnMove],
      3: [...moves, burnMove],
    };
    render(
      <BattleArena
        team={team}
        opponents={opp}
        playerMoves={playerMovesWithBurn}
        opponentMoves={oppMovesById}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /inferno/i }));
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('shows a defeat overlay with the final score once the player team is wiped out', async () => {
    const singleMon = [{ ...team[0], stats: { ...team[0].stats, hp: 1 } }];
    render(
      <BattleArena
        team={singleMon}
        opponents={opp}
        playerMoves={playerMovesById}
        opponentMoves={oppMovesById}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /splash/i }));
    expect(screen.getByText('DEFEATED')).toBeInTheDocument();
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
  });

  it('shows a wave-clear banner once all opponents are defeated', async () => {
    const oneOpp = [{ ...opp[0], stats: { ...opp[0].stats, hp: 1 } }];
    render(
      <BattleArena
        team={team}
        opponents={oneOpp}
        playerMoves={playerMovesById}
        opponentMoves={oppMovesById}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /splash/i }));
    expect(screen.getByTestId('wave-clear-banner')).toBeInTheDocument();
    expect(screen.getByText('Wave 1 cleared!')).toBeInTheDocument();
    expect(screen.getByText(/loading next opponents/i)).toBeInTheDocument();
  });
});
