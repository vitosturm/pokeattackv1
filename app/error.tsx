'use client';
import { Button } from '@/components/ui/button';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <p>Something went wrong.</p>
      <Button variant="outline" onClick={reset} className="mt-3">
        Reload
      </Button>
    </div>
  );
}
