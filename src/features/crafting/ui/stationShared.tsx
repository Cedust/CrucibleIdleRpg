import { ArrowRight, LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import { RARITY_LABEL } from '@/game/crafting/blacksmith';
import type { ArmorLoadout, ArmorSlot } from '@/game/types';
import { Icon } from '@/shared/ui/icons/Icon';
import { Panel } from '@/shared/ui/layout/Panel';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import {
  focusRing,
  hoverBorder,
  selectedRing,
  stateAttrs,
  transitionState,
} from '@/shared/ui/utils/state';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';
import {
  ARMOR_BASE_LABEL,
  ARMOR_COLUMN,
  ARMOR_SLOT_LABEL,
  costFormatter,
  RARITY_TEXT_CLASS,
} from './stationPresentation';

/**
 * Gemeinsame Bausteine der Handwerks-Stationen (Blacksmith Task 027, Jeweler Task 028):
 * Slot-Spalte, Bestands-Kopf, Sperr-Zustand und die Vorschau-/Kostenzeilen der Dienst-Panels.
 * Anzeige-Konstanten liegen in stationPresentation.ts.
 */

/** Ein Eintrag des dauerhaft sichtbaren Bestands-Kopfs einer Station. */
export interface FundsEntry {
  label: string;
  icon: ReactNode;
  value: ReactNode;
}

/** Dauerhaft sichtbarer Zahlmittel-Bestand der Station (Task 027/028). */
export function FundsBar({ entries }: { entries: readonly FundsEntry[] }) {
  return (
    <dl aria-label="Crafting funds" className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
      {entries.map((entry) => (
        <div key={entry.label} className="flex items-center gap-1.5 text-sm">
          {entry.icon}
          <dt className="sr-only">{entry.label}</dt>
          <dd aria-label={`${entry.label} amount`} className="font-semibold tabular-nums text-text">
            {entry.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Gesperrte Station: gedimmte Art, muted Text, Lock-Indikator (UI.md §6). */
export function LockedStation({
  ariaLabel,
  testId,
  icon,
  title,
  children,
}: {
  ariaLabel: string;
  testId: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Panel
      as="section"
      aria-label={ariaLabel}
      data-testid={testId}
      className="mx-auto mt-8 flex w-full max-w-xl flex-col items-center px-8 py-10 text-center"
    >
      <span
        aria-hidden="true"
        className="flex size-24 items-center justify-center rounded-full border-2 border-state-locked-border bg-surface-raised/50 opacity-(--state-deemphasis-medium)"
      >
        {icon}
      </span>
      <h3 className="mt-4 font-display text-display text-text">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">{children}</p>
      <span className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
        <LockKeyhole aria-hidden="true" className="size-3.5" />
        Locked
      </span>
    </Panel>
  );
}

/** Noch nicht freigeschalteter Armor-Slot. */
function LockedSlotRow({ slot }: { slot: ArmorSlot }) {
  return (
    <div
      {...stateAttrs({ semantic: 'locked' })}
      data-crafting-slot={slot}
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-lg border border-state-locked-border bg-surface/50 px-3 py-2.5',
        transitionState,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-raised/40 text-text-muted opacity-(--state-deemphasis-medium)"
      >
        <LockKeyhole className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-sm text-text">{ARMOR_SLOT_LABEL[slot]}</span>
        <span className="block text-xs text-text-muted">Locked</span>
      </span>
    </div>
  );
}

/** Werkstück-Auswahl der Station: die vier Armor-Slots des aktiven Charakters. */
export function SlotList({
  idPrefix,
  loadout,
  selectedSlot,
  onSelect,
}: {
  /** Stationseigener DOM-Id-Präfix der Radio-Einträge. */
  idPrefix: string;
  loadout: ArmorLoadout;
  selectedSlot: ArmorSlot;
  onSelect: (slot: ArmorSlot) => void;
}) {
  const unlockedSlots = ARMOR_COLUMN.filter((slot) => loadout[slot] !== undefined);
  const rovingProps = useRovingFocus({
    items: unlockedSlots,
    selected: selectedSlot,
    onSelect,
    itemDomId: (slot) => `${idPrefix}-slot-${slot}`,
    orientation: 'both',
  });

  return (
    <section aria-label="Armor slots" className="min-w-0">
      <SectionTitle as="h3" align="start">
        Armor
      </SectionTitle>
      <div role="radiogroup" aria-label="Armor slot" className="mt-2 flex flex-col gap-3">
        {ARMOR_COLUMN.map((slot) => {
          const item = loadout[slot];
          if (item === undefined) {
            return <LockedSlotRow key={slot} slot={slot} />;
          }

          const selected = slot === selectedSlot;
          return (
            <button
              key={slot}
              type="button"
              id={`${idPrefix}-slot-${slot}`}
              role="radio"
              aria-checked={selected}
              aria-label={`${ARMOR_SLOT_LABEL[slot]}, ${ARMOR_BASE_LABEL[item.itemType]} level ${item.itemLevel}, ${RARITY_LABEL[item.rarity]}`}
              {...rovingProps(slot)}
              {...stateAttrs({ selected })}
              data-crafting-slot={slot}
              onClick={() => onSelect(slot)}
              className={cn(
                'flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface/70 px-3 py-2.5 text-left',
                focusRing,
                selectedRing,
                hoverBorder,
                transitionState,
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-raised/60 text-accent-strong"
              >
                <Icon name="crucible-armory" size="sm" className="bg-current" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm text-text">
                  {ARMOR_SLOT_LABEL[slot]}
                </span>
                <span className="block truncate text-xs text-text-muted">
                  {ARMOR_BASE_LABEL[item.itemType]}{' '}
                  <span className="tabular-nums">[{item.itemLevel}]</span>
                </span>
              </span>
              <span className={cn('shrink-0 text-2xs uppercase', RARITY_TEXT_CLASS[item.rarity])}>
                {RARITY_LABEL[item.rarity]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Vorher-→-Nachher-Zeile einer Aktion; ohne `to` zeigt sie nur den Ist-Zustand. */
export function PreviewRow({ term, from, to }: { term: string; from: ReactNode; to?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-text-muted">{term}</dt>
      <dd className="flex items-center gap-1.5 font-medium tabular-nums text-text">
        {from}
        {to !== undefined ? (
          <>
            <ArrowRight aria-hidden="true" className="size-3.5 text-text-muted" />
            <span className="text-accent-strong">{to}</span>
          </>
        ) : null}
      </dd>
    </div>
  );
}

export function CostRow({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <span className="text-sm text-text-muted">Cost</span>
      <span className="flex items-center gap-3">{children}</span>
    </div>
  );
}

export function CostAmount({
  icon,
  amount,
  label,
}: {
  icon: ReactNode;
  amount: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-text">
      {icon}
      {costFormatter.format(amount)}
      <span className="sr-only">{label}</span>
    </span>
  );
}
