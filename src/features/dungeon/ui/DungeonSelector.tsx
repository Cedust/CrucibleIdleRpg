import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';

interface DungeonSelectorProps {
  unlockedDungeonIds: readonly Act1DungeonId[];
  selectedDungeonId: Act1DungeonId;
  onSelect: (dungeonId: Act1DungeonId) => void;
}

/** Shows locked entrances too, but only persisted checkpoints can be selected. */
export function DungeonSelector({
  unlockedDungeonIds,
  selectedDungeonId,
  onSelect,
}: DungeonSelectorProps) {
  return (
    <fieldset className="flex flex-wrap gap-2" aria-label="Dungeon selection">
      <legend className="sr-only">Choose a dungeon</legend>
      {ACT_1_DUNGEON_IDS.map((dungeonId, index) => {
        const selected = dungeonId === selectedDungeonId;
        const unlocked = unlockedDungeonIds.includes(dungeonId);

        return (
          <label
            key={dungeonId}
            className={`flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text transition-colors has-checked:border-ornament has-checked:bg-accent/10 has-checked:text-accent has-checked:shadow-glow-accent ${
              unlocked ? 'cursor-pointer hover:border-ornament' : 'cursor-not-allowed opacity-60'
            }`}
          >
            <input
              checked={selected}
              className="accent-accent"
              disabled={!unlocked}
              name="dungeon"
              type="radio"
              value={dungeonId}
              onChange={() => onSelect(dungeonId)}
            />
            <span>Dungeon {index + 1}</span>
            <span className="text-text-muted">{dungeonId}</span>
            {unlocked ? selected && <span className="sr-only">selected</span> : <span>Locked</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
