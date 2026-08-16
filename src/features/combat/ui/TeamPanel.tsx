import { TEAM_ORDER } from '@/game/characters/characters';
import { xpRequiredForNextLevel } from '@/game/rewards/xpRewards';
import type { Role } from '@/game/types';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { useSaveStore } from '@/features/save/saveStore';
import { cn } from '@/shared/ui/utils/cn';
import { Panel } from '@/shared/ui/layout/Panel';
import { ProgressBar } from '@/shared/ui/feedback/ProgressBar';
import { ROLE_ICON } from '@/shared/ui/icons/roleIcons';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { formatNumber } from '@/shared/utils/formatNumber';
import { useShallow } from 'zustand/react/shallow';
import { CombatPortrait } from './CombatPortrait';

const ROLE_LABEL: Record<Role, string> = {
  tank: 'Tank',
  melee: 'Melee',
  ranged: 'Ranged',
};

interface TeamPanelProps {
  className?: string;
}

function CharacterCard({ index }: { index: number }) {
  const character = useCombatStore(
    useShallow((state) => {
      const participant = state.combat?.characters[index];
      if (participant === undefined) return null;

      return {
        id: participant.id,
        name: participant.name,
        role: participant.role,
        health: participant.health,
        maxHealth: participant.maxHealth,
        barrier: participant.barrier,
        maxBarrier: participant.stats.defensive.barrier,
      };
    }),
  );
  const progression = useSaveStore((state) => {
    if (character === null || state.data === null) return null;
    return state.data.characters[character.id];
  });

  if (character === null || progression === null) {
    return null;
  }

  const RoleIcon = ROLE_ICON[character.role];
  const isDefeated = character.health <= 0;
  const xpRequired = xpRequiredForNextLevel(progression.level);

  return (
    <Panel as="article" variant="thin" className="flex min-w-0 items-center gap-3">
      <CombatPortrait
        characterId={character.id}
        size="xl"
        isDefeated={isDefeated}
        label={`${character.name} portrait`}
      />
      <div data-testid={`${character.id}-details`} className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-display text-text">{character.name}</h3>
          <div className="flex items-center gap-2">
            {isDefeated && (
              <span className="text-xs font-semibold uppercase text-danger">Fallen</span>
            )}
            <span role="img" aria-label={`${ROLE_LABEL[character.role]} role`}>
              <RoleIcon aria-hidden="true" className="size-4 text-accent" />
            </span>
          </div>
        </div>

        <ProgressBar
          label="Health"
          ariaLabel={`${character.name} health`}
          value={character.health}
          max={character.maxHealth}
          tone="health"
          size="sm"
        />
        <ProgressBar
          label="Barrier"
          ariaLabel={`${character.name} barrier`}
          value={character.barrier}
          max={Math.max(character.maxBarrier, 1)}
          valueText={formatNumber(character.barrier)}
          tone="barrier"
          size="sm"
        />
        <ProgressBar
          label={`Level ${progression.level}`}
          ariaLabel={`${character.name} experience`}
          value={progression.xp}
          max={xpRequired}
          valueText={
            xpRequired === 0
              ? 'MAX'
              : `${formatNumber(progression.xp)}/${formatNumber(xpRequired)} XP`
          }
          endLabel={xpRequired === 0 ? 'MAX' : formatNumber(progression.level + 1)}
          tone="xp"
          size="sm"
        />
      </div>
    </Panel>
  );
}

/** Team-Anzeige mit je einer selektiven Subscription pro Charakterkarte. */
export function TeamPanel({ className = '' }: TeamPanelProps) {
  const hasCombat = useCombatStore((state) => state.combat !== null);

  return (
    <section aria-label="Party" className={cn('min-h-0 min-w-0', className)}>
      <SectionTitle className="mb-3">Heroes</SectionTitle>
      {!hasCombat ? (
        <p className="text-sm text-text-muted">Start a combat to see your party.</p>
      ) : (
        <div className="space-y-3">
          {TEAM_ORDER.map((id, index) => (
            <CharacterCard key={id} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
