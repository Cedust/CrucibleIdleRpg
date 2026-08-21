import type { CharacterId, CharacterProgressionState } from '@/game/types';
import { CHARACTERS } from '@/game/characters/characters';
import { xpRequiredForNextLevel } from '@/game/rewards/xpRewards';
import { ProgressBar } from '@/shared/ui/feedback/ProgressBar';
import { Panel } from '@/shared/ui/layout/Panel';
import { cn } from '@/shared/ui/utils/cn';
import { formatNumber } from '@/shared/utils/formatNumber';

/** Level und XP-Fortschritt unter dem Portal; die Überschrift trägt die Level-Zahl selbst. */
export function LevelPanel({
  characterId,
  progression,
  className,
}: {
  characterId: CharacterId;
  progression: CharacterProgressionState;
  className?: string;
}) {
  const character = CHARACTERS[characterId];
  const { level, xp } = progression;
  const xpRequired = xpRequiredForNextLevel(level);

  return (
    <Panel
      as="section"
      padding="md"
      className={cn('min-w-0', className)}
      data-testid="heroes-progression"
    >
      <p className="text-center font-display text-display-lg text-accent-strong">Level {level}</p>
      <ProgressBar
        label="XP"
        ariaLabel={`${character.name} experience`}
        value={xp}
        max={xpRequired}
        valueText={
          xpRequired === 0 ? 'MAX' : `XP ${formatNumber(xp)} / ${formatNumber(xpRequired)}`
        }
        hideLabel
        tone="progress"
        size="md"
        labelSize="sm"
        className="mt-2"
      />
    </Panel>
  );
}
