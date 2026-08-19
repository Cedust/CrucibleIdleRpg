import { Button } from '@/shared/ui/controls/Button';
import { Panel } from '@/shared/ui/layout/Panel';
import { ProgressBar } from '@/shared/ui/feedback/ProgressBar';

interface SelectedDungeonPanelProps {
  actLabel: string;
  actName: string;
  dungeonLabel: string;
  dungeonName: string;
  description: string;
  /** Gesperrte Dungeons zeigen weder Progress noch Entry-Action. */
  locked: boolean;
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
  description,
  locked,
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
      variant="act"
      padding="none"
      className="mx-4 grid grid-cols-1 items-center gap-x-6 gap-y-3 px-6 py-5 @min-[42rem]:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <header className="space-y-0.5">
          <p className="font-display text-display-sm tracking-widest text-accent-strong">
            {actLabel} - {actName}
          </p>
          <h3 className="font-display text-display text-accent-strong">
            {dungeonLabel} - {dungeonName}
          </h3>
        </header>

        <p className="text-sm leading-6 text-text-muted">{description}</p>

        {startError !== null && (
          <p role="alert" className="text-sm text-danger">
            {startError}
          </p>
        )}

        {!locked && (
          <ProgressBar
            className="w-full min-w-0"
            label="Progress"
            ariaLabel={`${dungeonName} progress`}
            value={progress}
            max={totalFloorCount}
            valueText={`Floor ${progress} / ${totalFloorCount}`}
            tone="accent"
            labelSize="sm"
          />
        )}
      </div>

      {!locked && (
        <Button
          variant="ornate"
          className="justify-self-end self-end @min-[42rem]:self-center"
          disabled={disabled}
          onClick={onEnter}
        >
          {isStarting ? 'ENTERING DUNGEON…' : 'ENTER DUNGEON'}
        </Button>
      )}
    </Panel>
  );
}
