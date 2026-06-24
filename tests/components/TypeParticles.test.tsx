import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeParticles } from '@/components/TypeParticles';

describe('TypeParticles', () => {
  it('renders more sparks at strong intensity than at miss intensity', () => {
    const { rerender } = render(<TypeParticles trigger={1} type="fire" intensity="strong" />);
    const strongCount = screen.getAllByTestId('spark').length;
    rerender(<TypeParticles trigger={1} type="fire" intensity="miss" />);
    const missCount = screen.getAllByTestId('spark').length;
    expect(strongCount).toBeGreaterThan(missCount);
  });

  it('defaults to normal intensity (18 sparks) when none is given', () => {
    render(<TypeParticles trigger={1} type="water" />);
    expect(screen.getAllByTestId('spark')).toHaveLength(18);
  });

  it('renders nothing when trigger is 0', () => {
    render(<TypeParticles trigger={0} type="water" />);
    expect(screen.queryAllByTestId('spark')).toHaveLength(0);
  });
});
