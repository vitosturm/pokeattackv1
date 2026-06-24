import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BattleLog } from '@/components/BattleLog';

describe('BattleLog', () => {
  it('shows a placeholder when there are no lines yet', () => {
    render(<BattleLog lines={[]} />);
    expect(screen.getByText(/battle begins/i)).toBeInTheDocument();
  });

  it('renders the given lines', () => {
    render(<BattleLog lines={['Charizard used Flamethrower!', "It's super effective!"]} />);
    expect(screen.getByText('Charizard used Flamethrower!')).toBeInTheDocument();
    expect(screen.getByText("It's super effective!")).toBeInTheDocument();
  });

  it('only shows the most recent maxLines lines', () => {
    render(<BattleLog lines={['a', 'b', 'c', 'd', 'e', 'f']} maxLines={3} />);
    expect(screen.queryByText('a')).not.toBeInTheDocument();
    expect(screen.queryByText('c')).not.toBeInTheDocument();
    expect(screen.getByText('d')).toBeInTheDocument();
    expect(screen.getByText('e')).toBeInTheDocument();
    expect(screen.getByText('f')).toBeInTheDocument();
  });
});
