import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { ProgressBar } from '@/shared/ui/ProgressBar';

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

      <div className="flex flex-col items-end gap-3 @min-[19rem]:flex-row @min-[19rem]:items-end">
        <ProgressBar
          className="w-full min-w-0 @min-[19rem]:flex-1"
          label="Progress"
          ariaLabel={`${dungeonName} progress`}
          value={progress}
          max={totalFloorCount}
          tone="accent"
          labelSize="sm"
        />
        <Button
          className="@min-[19rem]:ml-4 @min-[19rem]:shrink-0"
          disabled={disabled}
          onClick={onEnter}
        >
          {isStarting ? 'ENTERING DUNGEON…' : 'ENTER DUNGEON'}
        </Button>
      </div>
    </Panel>
  );
}
