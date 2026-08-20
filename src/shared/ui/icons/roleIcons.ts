import { Crosshair, Shield, Swords, type LucideIcon } from 'lucide-react';
import type { Role } from '@/game/types';

/** Gemeinsame Rollen-Glyphen (TeamPanel, CharacterSwitcher). */
export const ROLE_ICON: Record<Role, LucideIcon> = {
  tank: Shield,
  melee: Swords,
  ranged: Crosshair,
};

/** Gemeinsame Rollen-Bezeichnungen (TeamPanel, Charakterportal). */
export const ROLE_LABEL: Record<Role, string> = {
  tank: 'Tank',
  melee: 'Melee',
  ranged: 'Ranged',
};
