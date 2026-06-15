'use client';

import type { Move } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { TypeBadge } from './TypeBadge';

interface Props {
  move: Move;
  disabled?: boolean;
  onSelect: (m: Move) => void;
}

export function MoveButton({ move, disabled, onSelect }: Props) {
  return (
    <Button
      onClick={() => onSelect(move)}
      disabled={disabled || move.damageClass === 'status'}
      variant="outline"
      className="flex flex-col items-start gap-1 h-auto py-2 px-3"
    >
      <span className="text-sm capitalize">{move.name.replace(/-/g, ' ')}</span>
      <div className="flex items-center gap-2 text-[10px]">
        <TypeBadge type={move.type} />
        <span>Pow {move.power || '—'}</span>
        <span>PP {move.pp}</span>
      </div>
    </Button>
  );
}
