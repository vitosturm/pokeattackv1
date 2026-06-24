import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIcon } from '@/components/StatusIcon';

describe('StatusIcon', () => {
  it('renders the lightning emoji for paralysis', () => {
    render(<StatusIcon status="paralysis" />);
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('renders the fire emoji for burn', () => {
    render(<StatusIcon status="burn" />);
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('renders the biohazard emoji for poison', () => {
    render(<StatusIcon status="poison" />);
    expect(screen.getByText('☣️')).toBeInTheDocument();
  });

  it('exposes the status name as the title for accessibility', () => {
    render(<StatusIcon status="burn" />);
    expect(screen.getByTitle('burn')).toBeInTheDocument();
  });
});
