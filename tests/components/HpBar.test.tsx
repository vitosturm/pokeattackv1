import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HpBar } from '@/components/HpBar';

describe('HpBar', () => {
  it('renders current / max', () => {
    render(<HpBar current={42} max={100} />);
    expect(screen.getByText('42 / 100')).toBeInTheDocument();
  });
  it('shows green at full, yellow at low, red at critical', () => {
    const { rerender } = render(<HpBar current={100} max={100} />);
    expect(screen.getByTestId('hp-fill')).toHaveClass('bg-green-500');
    rerender(<HpBar current={30} max={100} />);
    expect(screen.getByTestId('hp-fill')).toHaveClass('bg-yellow-400');
    rerender(<HpBar current={10} max={100} />);
    expect(screen.getByTestId('hp-fill')).toHaveClass('bg-red-500');
  });
});
