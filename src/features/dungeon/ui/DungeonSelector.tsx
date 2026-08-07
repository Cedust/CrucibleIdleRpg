import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import type { SaveData } from '@/features/save/saveSchema';

interface DungeonSelectorProps {
  save: SaveData;
  selectedDungeonId: Act1DungeonId;
  onSelect: (dungeonId: Act1DungeonId) => void;
}

/** Shows locked entrances too, but only persisted checkpoints can be selected. */
export function DungeonSelector({ save, selectedDungeonId, onSelect }: DungeonSelectorProps) {
  return (
    <fieldset className="flex flex-wrap gap-2" aria-label="Dungeon selection">
      <legend className="sr-only">Choose a dungeon</legend>
      {ACT_1_DUNGEON_IDS.map((dungeonId, index) => {
        const selected = dungeonId === selectedDungeonId;
        const unlocked = save.unlockedDungeonIds.includes(dungeonId);

        return (
          <label
            key={dungeonId}
            className={`flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text has-checked:border-accent has-checked:text-accent ${
              unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
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
