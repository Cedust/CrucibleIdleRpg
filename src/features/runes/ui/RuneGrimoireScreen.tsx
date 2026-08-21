import {
  Coins,
  Crosshair,
  LockKeyhole,
  Orbit,
  ScrollText,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSaveStore } from '@/features/save/saveStore';
import {
  etchCost,
  inscribeCandidates,
  inscribeCost,
  isRuneGrimoireUnlocked,
  runeDepthFromFirstVictories,
  runeLevelCap,
  runesForCategory,
  undiscoveredRunes,
} from '@/game/runes/runes';
import type {
  RuneCategory,
  RuneDefinition,
  RuneGrimoire,
  RuneId,
  RuneLevel,
} from '@/game/runes/types';
import { Button } from '@/shared/ui/controls/Button';
import { Panel } from '@/shared/ui/layout/Panel';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { formatNumber } from '@/shared/utils/formatNumber';

const CATEGORY_PRESENTATION: Readonly<
  Record<RuneCategory, { label: string; question: string; icon: LucideIcon }>
> = {
  trigger: { label: 'TRIGGERS', question: 'WHEN THE RITE ANSWERS', icon: Crosshair },
  effect: { label: 'EFFECTS', question: 'WHAT THE RITE UNLEASHES', icon: WandSparkles },
  modifier: { label: 'MODIFIERS', question: 'HOW THE RITE CHANGES', icon: Orbit },
};

function RuneLevelPips({ level }: { level: RuneLevel }) {
  return (
    <span
      aria-label={`Rune level ${level} of 5`}
      className="flex items-center gap-0.5 text-accent-strong"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < level ? 'drop-shadow-glow-accent-sm' : 'text-border'}
        >
          ◆
        </span>
      ))}
    </span>
  );
}

function Cost({ gold, runewords }: { gold: number; runewords: number }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs font-semibold tabular-nums text-text">
      <span className="flex items-center gap-1">
        <ScrollText aria-hidden="true" className="size-3 text-accent" />
        {formatNumber(runewords)}
      </span>
      <span className="flex items-center gap-1">
        <Coins aria-hidden="true" className="size-3 text-gold" />
        {formatNumber(gold)}
      </span>
    </span>
  );
}

function RuneCard({
  rune,
  level,
  cap,
  gold,
  runewords,
  onEtch,
}: {
  rune: RuneDefinition;
  level: RuneLevel | undefined;
  cap: number;
  gold: number;
  runewords: number;
  onEtch: (runeId: RuneId) => void;
}) {
  const known = level !== undefined;
  const cost = level === undefined || level >= cap ? null : etchCost(level);
  const affordable = cost !== null && gold >= cost.gold && runewords >= cost.runewords;

  return (
    <article
      role="listitem"
      data-rune-id={rune.id}
      data-known={known}
      className="ornate-corners relative isolate min-h-36 overflow-hidden rounded-md border border-ornament/45 bg-surface/90 p-3 shadow-panel before:pointer-events-none before:absolute before:inset-px before:bg-linear-to-br before:from-accent/8 before:via-transparent before:to-arcane/8 before:content-[''] data-[known=false]:border-border data-[known=false]:bg-background/82"
    >
      {known ? (
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-accent/55 bg-accent/10 text-accent-strong shadow-glow-accent-sm">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <RuneLevelPips level={level} />
          </div>
          <h4 className="mt-3 font-display text-display-sm text-accent-strong">{rune.name}</h4>
          <p className="mt-1 text-2xs tracking-[0.12em] text-text-muted">
            DEPTH {rune.minimumDepth}
          </p>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-ornament/25 pt-2.5">
            {cost === null ? (
              <span className="text-2xs font-semibold tracking-[0.14em] text-text-muted">
                MASTERED
              </span>
            ) : (
              <Cost {...cost} />
            )}
            <Button
              variant="ghost"
              className="shrink-0 px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]"
              disabled={!affordable}
              aria-label={cost === null ? `Etch ${rune.name}, at level cap` : `Etch ${rune.name}`}
              onClick={() => onEtch(rune.id)}
            >
              Etch
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative flex h-full min-h-28 flex-col items-center justify-center text-center">
          <span className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted">
            <LockKeyhole aria-hidden="true" className="size-4" />
          </span>
          <h4 className="mt-2 font-display text-sm text-text-muted">Unrevealed {rune.category}</h4>
          <p className="mt-1 text-2xs tracking-[0.12em] text-text-muted">
            DEPTH {rune.minimumDepth}
          </p>
        </div>
      )}
    </article>
  );
}

function RuneCategoryPanel({
  category,
  grimoire,
  reachedDepth,
  cap,
  gold,
  runewords,
  onInscribe,
  onEtch,
}: {
  category: RuneCategory;
  grimoire: RuneGrimoire;
  reachedDepth: number;
  cap: number;
  gold: number;
  runewords: number;
  onInscribe: (category: RuneCategory) => void;
  onEtch: (runeId: RuneId) => void;
}) {
  const { label, question, icon: CategoryIcon } = CATEGORY_PRESENTATION[category];
  const runes = runesForCategory(category);
  const visibleRunes = runes.filter(
    (rune) => grimoire[rune.id] !== undefined || rune.minimumDepth <= reachedDepth,
  );
  const candidates = inscribeCandidates(grimoire, category, reachedDepth);
  const unrevealed = undiscoveredRunes(grimoire, category, reachedDepth);
  const complete = runes.every((rune) => grimoire[rune.id] !== undefined);
  const cost = inscribeCost(category);
  const affordable = gold >= cost.gold && runewords >= cost.runewords;
  const canInscribe = candidates.length > 0 && affordable;
  const recipeMessage = complete
    ? 'Every rune in this chapter is inscribed.'
    : candidates.length === 0
      ? 'Deeper floors must reveal another mark.'
      : `${unrevealed.length} unrevealed mark${unrevealed.length === 1 ? '' : 's'} await.`;

  return (
    <Panel
      as="section"
      variant="standard"
      padding="md"
      aria-label={`${label} rune chapter`}
      className="flex min-w-0 flex-col overflow-hidden"
    >
      <header className="flex items-start gap-3 border-b border-ornament/35 pb-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ornament bg-background/80 text-accent-strong shadow-glow-accent-sm">
          <CategoryIcon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <SectionTitle as="h3" align="start">
            {label}
          </SectionTitle>
          <p className="mt-0.5 text-2xs tracking-[0.13em] text-text-muted">{question}</p>
        </div>
      </header>

      <div
        role="list"
        className="mt-4 grid gap-3 @min-[34rem]:grid-cols-2 @min-[70rem]:grid-cols-1"
      >
        {visibleRunes.map((rune) => (
          <RuneCard
            key={rune.id}
            rune={rune}
            level={grimoire[rune.id]}
            cap={cap}
            gold={gold}
            runewords={runewords}
            onEtch={onEtch}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-ornament/35 pt-3">
        <p className="text-2xs leading-5 text-text-muted">{recipeMessage}</p>
        {!complete ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <Cost {...cost} />
            <Button
              variant="ornate"
              className="shrink-0 px-3 py-1 text-2xs"
              disabled={!canInscribe}
              aria-label={`Inscribe ${label}`}
              onClick={() => onInscribe(category)}
            >
              Inscribe
            </Button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

/** Teamwide rune collection with deterministic Inscribe and RNG-free Etch. */
export function RuneGrimoireScreen() {
  const save = useSaveStore((state) => state.data);
  const inscribeRune = useSaveStore((state) => state.inscribeRune);
  const etchRune = useSaveStore((state) => state.etchRune);

  if (save === null) {
    return (
      <ScreenLayout background="rune-grimoire">
        <p aria-live="polite" className="text-text-muted">
          Opening Rune Grimoire…
        </p>
      </ScreenLayout>
    );
  }

  const grimoireUnlocked = isRuneGrimoireUnlocked(save.crucible);
  const reachedDepth = runeDepthFromFirstVictories(save.firstVictories);
  const cap = runeLevelCap(save.crucible);
  const knownRunes = Object.keys(save.runes).length;

  return (
    <ScreenLayout background="rune-grimoire" scroll={false}>
      <section
        aria-label="Rune Grimoire"
        className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col"
      >
        <ScreenHeader
          title="Rune Grimoire"
          intro="A living grimoire of promises carved from the deep. Discover a mark, bind its meaning, then etch its power into memory."
        >
          <dl className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5">
              <ScrollText aria-hidden="true" className="size-4 text-accent-strong" />
              <dt className="sr-only">Runewords</dt>
              <dd aria-label="Runewords amount" className="font-semibold tabular-nums text-text">
                {formatNumber(save.currencies.runewords)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles aria-hidden="true" className="size-4 text-arcane" />
              <dt className="sr-only">Known runes</dt>
              <dd className="font-semibold tabular-nums text-text">{knownRunes} / 17 RUNES</dd>
            </div>
            <div className="flex items-center gap-1.5 text-text-muted">
              <span className="font-display text-2xs tracking-[0.12em]">RUNE CAP {cap}</span>
              <span aria-hidden="true">·</span>
              <span className="font-display text-2xs tracking-[0.12em]">DEPTH {reachedDepth}</span>
            </div>
          </dl>
        </ScreenHeader>

        {!grimoireUnlocked ? (
          <Panel
            as="section"
            aria-label="Rune Grimoire locked"
            className="mx-auto mt-8 flex w-full max-w-xl flex-col items-center text-center"
          >
            <span className="flex size-24 items-center justify-center rounded-full border-2 border-state-locked-border bg-surface-raised/50 text-text-muted opacity-(--state-deemphasis-medium)">
              <LockKeyhole aria-hidden="true" className="size-9" />
            </span>
            <h2 className="mt-4 font-display text-display text-text">The Grimoire sleeps</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
              Awaken the Rune Grimoire in Anvil Sparks. Its first pages will grant a Trigger and an
              Effect, then every victory may yield Runewords.
            </p>
          </Panel>
        ) : (
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
            <div className="grid min-w-0 gap-4 @min-[58rem]:grid-cols-3">
              {(['trigger', 'effect', 'modifier'] as const).map((category) => (
                <RuneCategoryPanel
                  key={category}
                  category={category}
                  grimoire={save.runes}
                  reachedDepth={reachedDepth}
                  cap={cap}
                  gold={save.currencies.gold}
                  runewords={save.currencies.runewords}
                  onInscribe={(selectedCategory) => void inscribeRune(selectedCategory)}
                  onEtch={(runeId) => void etchRune(runeId)}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </ScreenLayout>
  );
}
