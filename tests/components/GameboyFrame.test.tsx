import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameboyFrame } from '@/components/GameboyFrame';
import { setMuted } from '@/lib/muteState';

describe('GameboyFrame', () => {
  beforeEach(() => {
    localStorage.clear();
    setMuted(false);
  });

  it('renders its children inside the screen', () => {
    render(
      <GameboyFrame>
        <p>Battle content</p>
      </GameboyFrame>,
    );
    expect(screen.getByText('Battle content')).toBeInTheDocument();
  });

  it('shows the unmuted label by default and toggles to muted on click', async () => {
    render(
      <GameboyFrame>
        <p>Battle content</p>
      </GameboyFrame>,
    );
    expect(screen.getByText(/select/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /mute/i }));
    expect(screen.getByText(/🔇/)).toBeInTheDocument();
  });
});
