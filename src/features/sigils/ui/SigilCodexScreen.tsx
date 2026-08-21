import { BookMarked, LockKeyhole, Sparkles } from 'lucide-react';
import { SIGILS, sigilAct, unlockedSigilActs } from '@/game/sigils/sigils';

import type { ArmorSlot } from '@/game/types';
import { Panel } from '@/shared/ui/layout/Panel';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { useSaveStore } from '@/features/save/saveStore';

const SLOT_LABELS: Record<ArmorSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  legs: 'Legs',
  feet: 'Feet',
};

const ACT_LABELS: Readonly<Record<number, string>> = {
  1: 'ACT I · THE ASHEN DEPTHS',
  2: 'ACT II · THE EMBER FOUNDRY',
  3: 'ACT III · THE FORGOTTEN CITADEL',
};

function SigilLevel({ level }: { level: number }) {
  return (
    <span aria-label={`Level ${level} of 5`} className="flex items-center gap-1 text-accent-strong">
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

function SigilEntry({
  sigil,
  level,
}: {
  sigil: (typeof SIGILS)[number];
  level: number | undefined;
}) {
  const isKnown = level !== undefined;

  return (
    <article
      role="listitem"
      data-sigil-id={sigil.id}
      data-known={isKnown}
      className="ornate-corners relative isolate min-h-48 overflow-hidden rounded-md border border-ornament/45 bg-surface/90 p-4 shadow-panel before:pointer-events-none before:absolute before:inset-px before:bg-linear-to-br before:from-accent/8 before:via-transparent before:to-arcane/8 before:content-[''] data-[known=false]:border-border data-[known=false]:bg-background/82"
    >
      {isKnown ? (
        <>
          <div
            aria-hidden="true"
            className="absolute -right-5 -top-5 size-28 rounded-full border border-accent/25 bg-accent/8 blur-[1px]"
          />
          <div className="relative flex items-start justify-between gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-accent/70 bg-background/80 text-accent-strong shadow-glow-accent">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 text-right">
              <p className="font-display text-2xs tracking-[0.16em] text-text-muted">SIGIL LEVEL</p>
              <SigilLevel level={level} />
            </div>
          </div>
          <div className="relative mt-4">
            <h3 className="font-display text-display-sm text-accent-strong drop-shadow-text-contrast">
              Sigil of {sigil.name}
            </h3>
            <p className="mt-3 font-display text-2xs tracking-[0.14em] text-text-muted">IMPRINT</p>
            <p className="mt-0.5 text-sm font-medium text-text">{sigil.imprint.label}</p>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-ornament/30 pt-3">
            <p className="font-display text-2xs tracking-[0.12em] text-text-muted">
              BOUND TO {sigil.slots.map((slot) => SLOT_LABELS[slot]).join(' · ')}
            </p>
            <p className="text-2xs text-text-muted">Source {sigil.sourceFloorId}</p>
          </div>
        </>
      ) : (
        <div className="relative flex h-full min-h-40 flex-col items-center justify-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-text-muted">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </span>
          <h3 className="mt-3 font-display text-display-sm text-text-muted">Unrevealed Sigil</h3>
        </div>
      )}
    </article>
  );
}

/** Archive-style Codex of the teamwide Sigil knowledge, not an item inventory. */
export function SigilCodexScreen() {
  const save = useSaveStore((state) => state.data);

  if (save === null) {
    return (
      <ScreenLayout background="sigil-codex">
        <p aria-live="polite" className="text-text-muted">
          Opening Sigil Codex…
        </p>
      </ScreenLayout>
    );
  }

  const knownCount = Object.keys(save.sigils).length;
  const visibleActs = unlockedSigilActs(save.sigils);

  return (
    <ScreenLayout background="sigil-codex">
      <section className="mx-auto flex w-full max-w-page flex-col pb-4" aria-label="Sigil Codex">
        <ScreenHeader
          title="Sigil Codex"
          intro="A record of the ancient marks wrested from the depths. Each recovered Sigil can one day be branded into armor."
          className="mb-4"
        >
          <p
            aria-label={`${knownCount} of ${SIGILS.length} sigils recovered`}
            className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text"
          >
            <BookMarked aria-hidden="true" className="size-4 text-accent-strong" />
            <span className="font-display text-display-sm text-accent-strong">{knownCount}</span>
            <span className="text-text">of {SIGILS.length} Sigils</span>
          </p>
        </ScreenHeader>

        <div className="space-y-6">
          {visibleActs.map((act) => {
            const sigils = SIGILS.filter((sigil) => sigilAct(sigil) === act);
            return (
              <Panel
                key={act}
                as="section"
                variant="standard"
                padding="md"
                className="overflow-visible"
              >
                <header className="relative flex items-center gap-3 border-b border-ornament/40 pb-3">
                  <span className="flex size-9 items-center justify-center rounded-full border border-ornament bg-background/80 font-display text-display-sm text-accent-strong shadow-glow-accent-sm">
                    {act}
                  </span>
                  <div>
                    <h2 className="font-display text-display-sm text-accent-strong">
                      {ACT_LABELS[act] ?? `ACT ${act}`}
                    </h2>
                    <p className="mt-0.5 text-2xs tracking-[0.12em] text-text-muted">
                      {sigils.filter((sigil) => save.sigils[sigil.id] !== undefined).length} OF{' '}
                      {sigils.length} SIGILS UNDISCOVERED
                    </p>
                  </div>
                </header>
                <div
                  role="list"
                  className="mt-4 grid gap-4 @min-[44rem]:grid-cols-2 @min-[76rem]:grid-cols-3"
                >
                  {sigils.map((sigil) => (
                    <SigilEntry key={sigil.id} sigil={sigil} level={save.sigils[sigil.id]} />
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      </section>
    </ScreenLayout>
  );
}
