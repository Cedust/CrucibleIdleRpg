import { useState } from 'react';
import { Link2, LockKeyhole, Sparkles, X } from 'lucide-react';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import { CombatPortrait } from '@/features/combat/ui/CombatPortrait';
import { useSaveStore } from '@/features/save/saveStore';
import { availableRunesForRiteSlot, runeById, unlockedRiteSlots } from '@/game/runes/runes';
import { RITE_SLOT_CATEGORY, type RiteSlot, type RuneId, type RuneLevel } from '@/game/runes/types';
import type { CharacterId } from '@/game/types';
import { Button } from '@/shared/ui/controls/Button';
import { Panel } from '@/shared/ui/layout/Panel';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import { focusRing, selectedRing, stateAttrs, transitionState } from '@/shared/ui/utils/state';

const RITE_SLOT_PRESENTATION: Readonly<Record<RiteSlot, { label: string; question: string }>> = {
  triggerRuneId: { label: 'TRIGGER', question: 'WHEN' },
  effectRuneId: { label: 'EFFECT', question: 'WHAT' },
  modifierRuneId: { label: 'MODIFIER', question: 'HOW' },
};

interface RiteSelection {
  characterId: CharacterId;
  slot: RiteSlot;
}

function RuneSocket({
  characterId,
  slot,
  runeId,
  runeLevel,
  unlocked,
  selected,
  onSelect,
}: {
  characterId: CharacterId;
  slot: RiteSlot;
  runeId: RuneId | null;
  runeLevel: RuneLevel | undefined;
  unlocked: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { label, question } = RITE_SLOT_PRESENTATION[slot];
  const rune = runeId === null ? undefined : runeById(runeId);
  const description = rune === undefined ? 'Empty' : `${rune.name} · Level ${runeLevel ?? 0}`;

  if (!unlocked) {
    return (
      <div
        {...stateAttrs({ semantic: 'locked' })}
        aria-label={`${CHARACTERS[characterId].name} ${label} slot locked`}
        className="flex min-h-19 min-w-0 items-center gap-2 rounded-md border border-state-locked-border bg-background/45 px-2.5 py-2 text-left"
      >
        <LockKeyhole aria-hidden="true" className="size-3.5 shrink-0 text-text-muted" />
        <span className="min-w-0">
          <span className="block font-display text-2xs tracking-[0.12em] text-text-muted">
            {label}
          </span>
          <span className="block text-2xs text-text-muted">SEALED</span>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      {...stateAttrs({ selected, semantic: rune === undefined ? 'empty' : 'normal' })}
      aria-label={`${CHARACTERS[characterId].name} ${label} slot, ${rune === undefined ? 'empty' : rune.name}`}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'group flex min-h-19 min-w-0 cursor-pointer items-center gap-2 rounded-md border border-ornament/45 bg-background/60 px-2.5 py-2 text-left',
        'data-[semantic=empty]:border-border data-[semantic=empty]:text-text-muted',
        'hover:border-ornament hover:bg-surface-raised/80',
        focusRing,
        selectedRing,
        transitionState,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-ornament/45 bg-accent/8 text-accent-strong group-data-[semantic=empty]:border-border group-data-[semantic=empty]:bg-surface group-data-[semantic=empty]:text-text-muted"
      >
        {rune === undefined ? <Link2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-2xs tracking-[0.12em] text-text-muted">
          {label} · {question}
        </span>
        <span className="block truncate text-xs font-semibold text-text group-data-[semantic=empty]:text-text-muted">
          {description}
        </span>
      </span>
    </button>
  );
}

function TalismanCard({
  characterId,
  selection,
  onSelect,
}: {
  characterId: CharacterId;
  selection: RiteSelection | null;
  onSelect: (next: RiteSelection) => void;
}) {
  const save = useSaveStore((state) => state.data);
  if (save === null) return null;

  const character = CHARACTERS[characterId];
  const slots = unlockedRiteSlots(save.crucible, characterId);
  const talismanUnlocked = slots.trigger && slots.effect;

  return (
    <article
      data-character-id={characterId}
      {...stateAttrs({ semantic: talismanUnlocked ? 'normal' : 'locked' })}
      className="ornate-corners relative isolate min-w-0 overflow-hidden rounded-md border border-ornament/45 bg-surface/85 p-3 shadow-panel data-[semantic=locked]:border-state-locked-border data-[semantic=locked]:bg-background/70"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-arcane/15 to-transparent"
      />
      <header className="relative flex items-center gap-3 border-b border-ornament/30 pb-3">
        <CombatPortrait characterId={characterId} size="sm" label={`${character.name} portrait`} />
        <div className="min-w-0">
          <h3 className="font-display text-display-sm text-accent-strong">{character.name}</h3>
          <p className="text-2xs tracking-[0.12em] text-text-muted">
            {talismanUnlocked ? 'TALISMAN AWAKENED' : 'TALISMAN SEALED'}
          </p>
        </div>
      </header>
      <div className="relative mt-3 grid gap-2">
        {(['triggerRuneId', 'effectRuneId', 'modifierRuneId'] as const).map((slot) => (
          <RuneSocket
            key={slot}
            characterId={characterId}
            slot={slot}
            runeId={save.rites[characterId][slot]}
            runeLevel={
              save.rites[characterId][slot] === null
                ? undefined
                : save.runes[save.rites[characterId][slot]]
            }
            unlocked={slots[RITE_SLOT_CATEGORY[slot]]}
            selected={selection?.characterId === characterId && selection.slot === slot}
            onSelect={() => onSelect({ characterId, slot })}
          />
        ))}
      </div>
    </article>
  );
}

function RiteWorkbench({ selection, onClose }: { selection: RiteSelection; onClose: () => void }) {
  const save = useSaveStore((state) => state.data);
  const setRiteRune = useSaveStore((state) => state.setRiteRune);
  if (save === null) return null;

  const { characterId, slot } = selection;
  const character = CHARACTERS[characterId];
  const currentRuneId = save.rites[characterId][slot];
  const choices = availableRunesForRiteSlot(save.rites, save.runes, characterId, slot);
  const { label, question } = RITE_SLOT_PRESENTATION[slot];

  return (
    <Panel
      as="section"
      variant="ornate"
      padding="md"
      aria-label="Rite socket selection"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-10 size-32 rounded-full border border-arcane/40 bg-arcane/8 blur-sm"
      />
      <header className="relative flex items-start justify-between gap-4 border-b border-ornament/40 pb-3">
        <div>
          <p className="font-display text-2xs tracking-[0.16em] text-text-muted">
            ENGRAVE THE RITE
          </p>
          <SectionTitle as="h3" align="start" className="mt-1">
            {character.name} · {label}
          </SectionTitle>
          <p className="mt-1 text-xs text-text-muted">
            Choose which known rune answers{' '}
            <span className="font-semibold text-text">{question}</span>. Bound runes are unique
            across the whole party.
          </p>
        </div>
        <Button
          variant="icon"
          aria-label="Close Rite socket selection"
          className="relative shrink-0"
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </header>

      <div className="relative mt-4 grid gap-2 @min-[40rem]:grid-cols-2 @min-[66rem]:grid-cols-3">
        {choices.map((rune) => {
          const selected = rune.id === currentRuneId;
          const level = save.runes[rune.id];
          return (
            <Button
              key={rune.id}
              variant="ghost"
              selected={selected}
              aria-label={`Bind ${rune.name}, level ${level ?? 0}`}
              className="flex min-h-14 min-w-0 items-center justify-between gap-3 px-3 py-2 text-left"
              onClick={() => void setRiteRune(characterId, slot, rune.id)}
            >
              <span className="min-w-0">
                <span className="block truncate font-display text-sm text-accent-strong">
                  {rune.name}
                </span>
                <span className="block text-2xs tracking-[0.11em] text-text-muted">
                  LEVEL {level ?? 0}
                </span>
              </span>
              <span className="shrink-0 text-2xs font-semibold tracking-[0.12em] text-text-muted">
                {selected ? 'BOUND' : 'BIND'}
              </span>
            </Button>
          );
        })}
      </div>

      {currentRuneId !== null ? (
        <footer className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ornament/30 pt-3">
          <p className="text-xs text-text-muted">
            Unbinding is free. The rune remains in the Grimoire.
          </p>
          <Button
            variant="ghost"
            aria-label={`Clear ${character.name} ${label} slot`}
            className="px-3 py-1.5 text-2xs uppercase tracking-[0.12em]"
            onClick={() => void setRiteRune(characterId, slot, null)}
          >
            Clear Socket
          </Button>
        </footer>
      ) : null}
    </Panel>
  );
}

/** Teamwide Talisman board: configuration stays in Runescribe, never in Armor loadout. */
export function RiteConfigurationPanel() {
  const [selection, setSelection] = useState<RiteSelection | null>(null);

  return (
    <section aria-label="Talismans and Rites" className="mt-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-5 gap-y-1">
        <div>
          <SectionTitle as="h2" align="start">
            Talismans &amp; Rites
          </SectionTitle>
          <p className="mt-1 text-xs text-text-muted">
            Three awakened vessels, one unique rune bound to each Rite slot.
          </p>
        </div>
        <p className="font-display text-2xs tracking-[0.14em] text-text-muted">FREE TO REFORGE</p>
      </div>
      <div className="grid min-w-0 gap-4 @min-[58rem]:grid-cols-3">
        {TEAM_ORDER.map((characterId) => (
          <TalismanCard
            key={characterId}
            characterId={characterId}
            selection={selection}
            onSelect={setSelection}
          />
        ))}
      </div>
      {selection === null ? (
        <p className="mt-3 text-xs text-text-muted">
          Select an awakened socket to bind, exchange, or clear its rune.
        </p>
      ) : (
        <div className="mt-4">
          <RiteWorkbench selection={selection} onClose={() => setSelection(null)} />
        </div>
      )}
    </section>
  );
}
