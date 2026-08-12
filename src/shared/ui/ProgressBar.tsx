import { formatNumber } from '@/shared/utils/formatNumber';

interface ProgressBarProps {
  label: string;
  ariaLabel?: string;
  value: number;
  max: number;
  valueText?: string;
  endLabel?: string;
  hideLabel?: boolean;
  tone?: 'health' | 'barrier' | 'xp';
  size?: 'sm' | 'md';
}

const TONE_CLASSES = {
  health: 'from-danger/80 to-danger',
  barrier: 'from-info/80 to-info',
  xp: 'from-arcane/80 to-arcane',
} as const;

const SIZE_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2.5',
} as const;

function percentage(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.min(Math.max((value / max) * 100, 0), 100);
}

/** Zugängliche, einzelne Ressourcenleiste mit sichtbarem Label und Wert. */
export function ProgressBar({
  label,
  ariaLabel = label,
  value,
  max,
  valueText,
  endLabel,
  hideLabel = false,
  tone = 'health',
  size = 'md',
}: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), Math.max(max, 0));

  return (
    <div className="space-y-1">
      {endLabel === undefined && hideLabel ? (
        <div className="flex justify-center text-xs">
          <span className="tabular-nums text-text-muted">
            {valueText ?? `${formatNumber(safeValue)} / ${formatNumber(max)}`}
          </span>
        </div>
      ) : endLabel === undefined ? (
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="font-medium text-text">{label}</span>
          <span className="tabular-nums text-text-muted">
            {valueText ?? `${formatNumber(safeValue)} / ${formatNumber(max)}`}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 text-xs">
          <span className="font-medium text-text">{label}</span>
          <span className="tabular-nums text-text-muted">
            {valueText ?? `${formatNumber(safeValue)} / ${formatNumber(max)}`}
          </span>
          <span className="text-right font-medium tabular-nums text-text">{endLabel}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={safeValue}
        className={`${SIZE_CLASSES[size]} overflow-hidden rounded-full bg-background ring-1 ring-inset ring-border/60`}
      >
        <div
          className={`h-full rounded-full bg-linear-to-r transition-[width] ${TONE_CLASSES[tone]}`}
          style={{ width: `${percentage(safeValue, max)}%` }}
        />
      </div>
    </div>
  );
}
