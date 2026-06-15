'use client';

import { motion } from 'framer-motion';

export function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          data-testid="hp-fill"
          className={`h-full ${color}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <div className="text-[10px] mt-1 font-mono text-white/70">{current} / {max}</div>
    </div>
  );
}
