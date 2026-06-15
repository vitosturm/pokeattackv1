'use client';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <p>Couldn&apos;t load this Pokémon.</p>
      <button onClick={reset} className="mt-3 underline">
        Retry
      </button>
    </div>
  );
}
