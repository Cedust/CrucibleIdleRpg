import type { CharacterId } from '@/game/types';
import { Skull } from 'lucide-react';

type PortraitSize = 'sm' | 'md' | 'lg' | 'xl';

const CHARACTER_PORTRAIT_SRC: Record<CharacterId, string> = {
  korvin: '/assets/portraits/korvin.png',
  rhaya: '/assets/portraits/rhaya.png',
  quinn: '/assets/portraits/quinn.png',
};

const SIZE_CLASSES: Record<PortraitSize, string> = {
  sm: 'size-9',
  md: 'size-14',
  lg: 'size-22',
  xl: 'size-36',
};

interface CombatPortraitProps {
  characterId?: CharacterId;
  size?: PortraitSize;
  isDefeated?: boolean;
  label?: string;
}

/** Einheitliche statische Portraits für Team, Gegner-Platzhalter und Zuganzeige. */
export function CombatPortrait({
  characterId,
  size = 'md',
  isDefeated = false,
  label,
}: CombatPortraitProps) {
  const accessibleLabel =
    label ?? (characterId === undefined ? 'Enemy portrait' : `${characterId} portrait`);

  return (
    <div
      data-testid={
        characterId === undefined
          ? 'enemy-portrait-placeholder'
          : `character-portrait-${characterId}`
      }
      className={`${SIZE_CLASSES[size]} shrink-0 overflow-hidden rounded-md border border-ornament/70 bg-surface-raised shadow-panel ${
        isDefeated ? 'opacity-35 grayscale' : ''
      }`}
    >
      {characterId === undefined ? (
        <div
          role="img"
          aria-label={accessibleLabel}
          className="flex size-full items-center justify-center bg-background/70 text-text-muted"
        >
          <Skull aria-hidden="true" className="size-1/2" />
        </div>
      ) : (
        <img
          src={CHARACTER_PORTRAIT_SRC[characterId]}
          alt={accessibleLabel}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}
