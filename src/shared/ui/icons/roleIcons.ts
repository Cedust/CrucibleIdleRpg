import { Crosshair, Shield, Swords, type LucideIcon } from 'lucide-react';
import type { Role } from '@/game/types';

/** Gemeinsame Rollen-Glyphen (TeamPanel, CharacterSwitcher). */
export const ROLE_ICON: Record<Role, LucideIcon> = {
  tank: Shield,
  melee: Swords,
  ranged: Crosshair,
};
