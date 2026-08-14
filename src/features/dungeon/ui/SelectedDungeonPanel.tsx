import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';

interface SelectedDungeonPanelProps {
  actLabel: string;
  actName: string;
  dungeonLabel: string;
  dungeonName: string;
  masteredFloorCount: number;
  totalFloorCount: number;
  disabled: boolean;
  isStarting: boolean;
  startError: string | null;
  onEnter: () => void;
}

function progressPercentage(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.max((value / max) * 100, 0), 100);
}

/** Summary and entry action for the currently selected dungeon card. */
export function SelectedDungeonPanel({
  actLabel,
  actName,
  dungeonLabel,
  dungeonName,
  masteredFloorCount,
  totalFloorCount,
  disabled,
  isStarting,
  startError,
  onEnter,
}: SelectedDungeonPanelProps) {
  const progress = Math.min(Math.max(masteredFloorCount, 0), totalFloorCount);

  return (
    <Panel
      as="section"
      aria-label={`${dungeonName} details`}
      variant="thin"
      padding="none"
      className="mx-2 flex flex-col gap-3 px-4 py-3"
    >
      <header className="space-y-0.5">
        <p className="font-display text-display-sm tracking-widest text-accent-strong">
          {actLabel} - {actName}
        </p>
        <h3 className="font-display text-display text-accent-strong">
          {dungeonLabel} - {dungeonName}
        </h3>
      </header>

      {startError !== null && (
        <p role="alert" className="text-sm text-danger">
          {startError}
        </p>
      )}

      <div className="flex flex-col items-end gap-3 @min-[24rem]:flex-row @min-[24rem]:items-end">
        <div className="w-full min-w-0 space-y-1.5 @min-[24rem]:flex-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-text">Progress</span>
            <span className="tabular-nums text-text-muted">
              {progress} / {totalFloorCount}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${dungeonName} progress`}
            aria-valuemin={0}
            aria-valuemax={totalFloorCount}
            aria-valuenow={progress}
            className="h-2.5 overflow-hidden rounded-full bg-background ring-1 ring-inset ring-border/60"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-accent/80 to-accent transition-[width]"
              style={{ width: `${progressPercentage(progress, totalFloorCount)}%` }}
            />
          </div>
        </div>
        <Button
          className="@min-[24rem]:ml-4 @min-[24rem]:shrink-0"
          disabled={disabled}
          onClick={onEnter}
        >
          {isStarting ? 'ENTERING DUNGEON...' : 'ENTER DUNGEON'}
        </Button>
      </div>
    </Panel>
  );
}
