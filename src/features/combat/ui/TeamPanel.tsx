import { ProgressBar } from '@/shared/ui/ProgressBar';
import { TEAM_ORDER } from '@/game/characters/characters';
import { useCombatStore } from '@/features/combat/state/combatStore';

const ROLE_LABEL = {
  tank: 'Tank',
  melee: 'Melee',
  ranged: 'Ranged',
} as const;

function CharacterCard({ index }: { index: number }) {
  const name = useCombatStore((state) => state.combat?.characters[index]?.name ?? null);
  const role = useCombatStore((state) => state.combat?.characters[index]?.role ?? null);
  const health = useCombatStore((state) => state.combat?.characters[index]?.health ?? 0);
  const maxHealth = useCombatStore((state) => state.combat?.characters[index]?.maxHealth ?? 0);
  const barrier = useCombatStore((state) => state.combat?.characters[index]?.barrier ?? 0);

  if (name === null || role === null) {
    return null;
  }

  return (
    <article className="rounded-lg border border-border bg-surface-raised p-3">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h4 className="font-semibold">{name}</h4>
        <span className="text-xs uppercase tracking-wide text-text-muted">{ROLE_LABEL[role]}</span>
      </div>
      <ProgressBar label={name} value={health} max={maxHealth} barrier={barrier} />
    </article>
  );
}

/** Team-Anzeige mit eigener Subscription auf den Charakterzustand. */
export function TeamPanel() {
  const hasCombat = useCombatStore((state) => state.combat !== null);

  return (
    <section
      aria-labelledby="team-heading"
      className="rounded-xl border border-border bg-surface p-4"
    >
      <h3
        id="team-heading"
        className="text-sm font-semibold uppercase tracking-wider text-text-muted"
      >
        Team
      </h3>

      {!hasCombat ? (
        <p className="mt-4 text-sm text-text-muted">Start a combat to see your team.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {TEAM_ORDER.map((id, index) => (
            <CharacterCard key={id} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
