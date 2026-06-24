import type { StatusCondition } from '@/lib/types';

interface StatusIconConfig {
  emoji: string;
  bg: string;
  textBlack?: boolean;
}

const STATUS_ICON: Record<StatusCondition, StatusIconConfig> = {
  paralysis: { emoji: '⚡', bg: 'bg-[#f8d030]', textBlack: true },
  burn: { emoji: '🔥', bg: 'bg-[#f08030]' },
  poison: { emoji: '☣️', bg: 'bg-[#a040a0]' },
};

export function StatusIcon({ status }: { status: StatusCondition }) {
  const cfg = STATUS_ICON[status];
  return (
    <span
      data-testid="status-icon"
      title={status}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${cfg.bg} ${cfg.textBlack ? 'text-black' : ''}`}
    >
      {cfg.emoji}
    </span>
  );
}
