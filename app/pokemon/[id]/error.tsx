'use client';
import { Button } from '@/components/ui/button';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <p>Couldn&apos;t load this Pokémon.</p>
      <Button variant="outline" onClick={reset} className="mt-3">
        Retry
      </Button>
    </div>
  );
}
