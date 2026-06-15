'use client';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <p>Something went wrong.</p>
      <button onClick={reset} className="mt-3 underline">
        Reload
      </button>
    </div>
  );
}
