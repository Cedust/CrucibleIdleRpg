import { formatNumber } from '@/shared/utils/formatNumber';
import { cn } from '../utils/cn';

interface ProgressBarProps {
  label: string;
  ariaLabel?: string;
  value: number;
  max: number;
  valueText?: string;
  endLabel?: string;
  hideLabel?: boolean;
  tone?: 'health' | 'barrier' | 'xp' | 'accent';
  size?: 'sm' | 'md';
  labelSize?: 'xs' | 'sm';
  className?: string;
}

const TONE_CLASSES = {
  health: 'from-danger/80 to-danger',
  barrier: 'from-info/80 to-info',
  xp: 'from-arcane/80 to-arcane',
  accent: 'from-accent/80 to-accent',
} as const;

const SIZE_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2.5',
} as const;

const LABEL_SIZE_CLASSES = {
  xs: 'text-xs',
  sm: 'text-sm',
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
  labelSize = 'xs',
  className,
}: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), Math.max(max, 0));
  const labelSizeClass = LABEL_SIZE_CLASSES[labelSize];

  return (
    <div className={cn('space-y-1', className)}>
      {endLabel === undefined && hideLabel ? (
        <div className={cn('flex justify-center', labelSizeClass)}>
          <span className="tabular-nums text-text-muted">
            {valueText ?? `${formatNumber(safeValue)} / ${formatNumber(max)}`}
          </span>
        </div>
      ) : endLabel === undefined ? (
        <div className={cn('flex items-baseline justify-between gap-3', labelSizeClass)}>
          <span className="font-medium text-text">{label}</span>
          <span className="tabular-nums text-text-muted">
            {valueText ?? `${formatNumber(safeValue)} / ${formatNumber(max)}`}
          </span>
        </div>
      ) : (
        <div className={cn('grid grid-cols-[1fr_auto_1fr] items-baseline gap-2', labelSizeClass)}>
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
        className={cn(
          SIZE_CLASSES[size],
          'overflow-hidden rounded-full bg-background ring-1 ring-inset ring-border/60',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-linear-to-r transition-[width] motion-reduce:transition-none',
            TONE_CLASSES[tone],
          )}
          style={{ width: `${percentage(safeValue, max)}%` }}
        />
      </div>
    </div>
  );
}
