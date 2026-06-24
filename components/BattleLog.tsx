'use client';

interface Props {
  lines: string[];
  maxLines?: number;
}

export function BattleLog({ lines, maxLines = 5 }: Props) {
  const visible = lines.slice(-maxLines);
  return (
    <div
      className="glass-panel rounded-lg p-3 text-xs text-white/80 space-y-1 max-h-28 overflow-y-auto"
      aria-live="polite"
    >
      {visible.length === 0 ? (
        <p className="text-white/40">The battle begins...</p>
      ) : (
        visible.map((line, i) => <p key={i}>{line}</p>)
      )}
    </div>
  );
}
