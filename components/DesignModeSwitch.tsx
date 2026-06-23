'use client';

import { useDesignMode } from '@/hooks/useDesignMode';

export function DesignModeSwitch() {
  const { mode, setMode } = useDesignMode();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-white/15 bg-black/30 p-1"
      role="group"
      aria-label="Homepage design"
    >
      {(['video', 'classic'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider transition ${
            mode === m ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          }`}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {m === 'classic' ? 'Classic' : 'Video'}
        </button>
      ))}
    </div>
  );
}
