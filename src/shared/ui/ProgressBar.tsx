import { formatNumber } from '@/shared/utils/formatNumber';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  /** Barrier wird auf derselben Skala, aber ausdrücklich getrennt von Health angezeigt. */
  barrier?: number;
}

function percentage(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.min(Math.max((value / max) * 100, 0), 100);
}

/** Zugängliche Health-Anzeige mit optionaler, separater Barrier-Leiste. */
export function ProgressBar({ label, value, max, barrier }: ProgressBarProps) {
  const healthValue = Math.min(Math.max(value, 0), Math.max(max, 0));
  const barrierValue = Math.max(barrier ?? 0, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-text">Health</span>
        <span className="tabular-nums text-text-muted">
          {formatNumber(healthValue)} / {formatNumber(max)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} health`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={healthValue}
        className="h-2.5 overflow-hidden rounded-full bg-background ring-1 ring-inset ring-border/60"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-success/80 to-success transition-[width]"
          style={{ width: `${percentage(healthValue, max)}%` }}
        />
      </div>

      {barrier !== undefined && (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-xs text-warning">
            <span className="font-medium">Barrier {formatNumber(barrierValue)}</span>
            <span className="text-text-muted">separate</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${label} barrier`}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={barrierValue}
            className="h-1.5 overflow-hidden rounded-full bg-background ring-1 ring-inset ring-border/60"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-warning/80 to-warning transition-[width]"
              style={{ width: `${percentage(barrierValue, max)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
