import { Check, Lock } from 'lucide-react';
import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import { ACT_1_DUNGEON_DISPLAY_META } from '@/game/encounters/actMeta';
import { cn } from '@/shared/ui/utils/cn';
import { stateAttrs, transitionState } from '@/shared/ui/utils/state';
import { GATE_ART_SRC, gateVariantFor } from './gateArt';

interface DungeonSelectorProps {
  unlockedDungeonIds: readonly Act1DungeonId[];
  completedDungeons: Readonly<Record<Act1DungeonId, boolean>>;
  selectedDungeonId: Act1DungeonId;
  onSelect: (dungeonId: Act1DungeonId) => void;
}

/** Shows and selects every entrance; availability only controls whether a run may start. */
export function DungeonSelector({
  unlockedDungeonIds,
  completedDungeons,
  selectedDungeonId,
  onSelect,
}: DungeonSelectorProps) {
  return (
    // min-w-0 hebt das Fieldset-Default `min-inline-size: min-content` auf; das
    // auto-fit-Grid streckt die Tore über die volle Zeilenbreite und bricht sie
    // bei schmalen Containern in neue Reihen um. Der horizontale Abstand lebt
    // als px-4 in den Kacheln (statt gap-x), damit die Pfadsegmente sich an der
    // gemeinsamen Kachelkante berühren, ohne das Fieldset zu überlaufen.
    <fieldset
      className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-y-4"
      aria-label="Dungeon selection"
    >
      <legend className="sr-only">Choose a dungeon</legend>
      {ACT_1_DUNGEON_IDS.map((dungeonId, index) => {
        const meta = ACT_1_DUNGEON_DISPLAY_META[dungeonId];
        const selected = dungeonId === selectedDungeonId;
        const unlocked = unlockedDungeonIds.includes(dungeonId);
        const status = !unlocked
          ? 'LOCKED'
          : completedDungeons[dungeonId]
            ? 'COMPLETED'
            : 'AVAILABLE';

        return (
          <label
            key={dungeonId}
            {...stateAttrs({ selected, semantic: unlocked ? 'normal' : 'locked' })}
            className={cn(
              'group flex min-w-0 cursor-pointer flex-col items-center gap-2 px-4 py-2 text-text',
              transitionState,
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-state-focus',
            )}
          >
            <input
              checked={selected}
              className="sr-only"
              name="dungeon"
              type="radio"
              value={dungeonId}
              onChange={() => onSelect(dungeonId)}
            />
            {/* Whitespace-Textknoten trennen die Spans im Accessible Name des Radios.
                min-h-[2lh] reserviert zwei Namenszeilen, damit alle Tore auf einer Linie stehen. */}
            <span className="flex flex-col gap-0.5 text-center">
              <span className="text-xs tracking-widest text-text-muted">{meta.label}</span>{' '}
              <span
                className={cn(
                  'min-h-[2lh] font-display text-display-sm',
                  selected && 'text-accent-strong',
                )}
              >
                {meta.name}
              </span>
            </span>{' '}
            <img
              src={GATE_ART_SRC[gateVariantFor(dungeonId)][unlocked ? 'open' : 'locked']}
              alt=""
              aria-hidden="true"
              className={cn(
                'w-full object-contain',
                transitionState,
                selected && 'scale-105 drop-shadow-glow-accent',
                !unlocked && 'opacity-(--state-deemphasis-weak) group-hover:opacity-100',
              )}
            />
            {/* Akt-Pfad (Draft v5): Gold-Linie von Tor zu Tor mit Status-Medaillon.
                Die Segmente reichen durch das px-4-Kachel-Padding exakt bis zur
                Kachelkante und treffen dort das Segment des Nachbartors (gap-x = 0);
                der Verlauf dimmt zur Kante hin und markiert so die Tor-Übergänge. */}
            <span aria-hidden="true" className="relative flex w-full items-center justify-center">
              {index > 0 && (
                <span className="absolute top-1/2 right-1/2 h-px w-[calc(50%+1rem)] -translate-y-1/2 bg-linear-to-r from-accent/25 to-accent/55" />
              )}
              {index < ACT_1_DUNGEON_IDS.length - 1 && (
                <span className="absolute top-1/2 left-1/2 h-px w-[calc(50%+1rem)] -translate-y-1/2 bg-linear-to-r from-accent/55 to-accent/25" />
              )}
              <span
                className={cn(
                  'relative flex size-8 items-center justify-center rounded-full border bg-background/80',
                  status === 'LOCKED' && 'border-ornament/50 text-text-muted',
                  status === 'COMPLETED' && 'border-success/60 text-success',
                  status === 'AVAILABLE' && 'border-accent/60 text-accent',
                )}
              >
                {status === 'LOCKED' && <Lock className="size-4" />}
                {status === 'COMPLETED' && <Check className="size-4" />}
                {status === 'AVAILABLE' && <span className="size-2 rotate-45 bg-accent" />}
              </span>
            </span>
            <span className="sr-only"> {status}</span>
            {selected && <span className="sr-only"> selected</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
