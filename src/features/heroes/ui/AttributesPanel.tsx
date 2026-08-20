import { ATTRIBUTE_AXES, TONE_TEXT_CLASSES } from './statsPresentation';
import type { AttributePoints, CharacterProgressionState } from '@/game/types';
import { Check, Coins, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { attributeRespecCost, refundedAttributePoints } from '@/game/rewards/xpRewards';

import { Button } from '@/shared/ui/controls/Button';
import { Icon } from '@/shared/ui/icons/Icon';
import { Panel } from '@/shared/ui/layout/Panel';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import { formatNumber } from '@/shared/utils/formatNumber';

function total(points: AttributePoints): number {
  return points.ferocity + points.resilience + points.vigor;
}

interface AttributesPanelProps {
  progression: CharacterProgressionState;
  gold: number;
  /** `null` = normaler Modus; sonst der laufende Respec-Entwurf. */
  draft: AttributePoints | null;
  onSpend: (attribute: keyof AttributePoints) => void;
  onDraftChange: (next: AttributePoints) => void;
  onStartRespec: () => void;
  onCancelRespec: () => void;
  onConfirmRespec: () => void;
}

/**
 * Attribute der linken Spalte. Außerhalb des Respec-Modus gibt der Plus-Button freie Punkte
 * direkt aus. Im Respec-Modus arbeiten Minus und Plus auf einem lokalen Entwurf; erst
 * `CONFIRM` schreibt ihn gegen Gold, `CANCEL` verwirft ihn.
 *
 * Beide Modi teilen sich denselben Aufbau: zentrierter Titel in der Kopfzeile, darunter die
 * Attributzeilen, darunter eine Fußzeile aus linksbündigem Text und rechtsbündigen Buttons.
 * RESPEC steht dort an derselben Stelle wie später CANCEL/CONFIRM, damit der Wechsel in den
 * Respec-Modus die Höhe des Panels nicht verändert. Die Kopfzeile trägt drei gleich breite
 * Spalten und die Höhe der Punkte-Raute; der Titel steht damit unabhängig von den beiden
 * Randspalten mittig, und ihre Inhalte schalten ohne Höhensprung: die Raute erscheint bei freien
 * Punkten und im Respec-Modus, der Gold-Bestand nur im Respec-Modus.
 */
export function AttributesPanel({
  progression,
  gold,
  draft,
  onSpend,
  onDraftChange,
  onStartRespec,
  onCancelRespec,
  onConfirmRespec,
}: AttributesPanelProps) {
  const respeccing = draft !== null;
  const points = draft ?? progression.attributePoints;
  const available = total(progression.attributePoints) + progression.freeAttributePoints;
  const freePoints = respeccing ? available - total(points) : progression.freeAttributePoints;
  const refunded = respeccing ? refundedAttributePoints(progression.attributePoints, points) : 0;
  const cost = attributeRespecCost(refunded);
  const affordable = gold >= cost;

  return (
    <Panel as="section" padding="md" className="min-w-0" data-testid="heroes-attributes">
      <div className="grid min-h-7 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        {respeccing ? (
          <p
            className="flex min-w-0 items-center gap-1.5 text-sm text-text-muted"
            data-testid="heroes-respec-funds"
          >
            <span className="sr-only">{formatNumber(gold)} Gold available</span>
            <Coins aria-hidden="true" className="size-4 shrink-0 text-gold" />
            <span aria-hidden="true" className="truncate tabular-nums">
              {formatNumber(gold)}
            </span>
          </p>
        ) : (
          <span />
        )}
        <SectionTitle as="h3" size="md">
          Attributes
        </SectionTitle>
        <span className="justify-self-end">
          {freePoints > 0 || respeccing ? (
            <span
              aria-hidden="true"
              data-testid="heroes-free-points-badge"
              className={cn(
                'flex size-7 rotate-45 items-center justify-center border',
                freePoints > 0
                  ? 'border-accent-strong bg-accent-strong/10 shadow-glow-accent-sm'
                  : 'border-border bg-background',
              )}
            >
              <span
                className={cn(
                  '-rotate-45 font-display text-sm tabular-nums',
                  freePoints > 0 ? 'text-accent-strong' : 'text-text-muted',
                )}
              >
                {freePoints}
              </span>
            </span>
          ) : null}
          <span className="sr-only" data-testid="heroes-free-points">
            {freePoints} attribute {freePoints === 1 ? 'point' : 'points'} available
          </span>
        </span>
      </div>
      <dl className="mt-2 divide-y divide-border/50 border-t border-border/50">
        {ATTRIBUTE_AXES.map((axis) => {
          const value = points[axis.attribute];
          const canIncrease = freePoints > 0;

          return (
            <div
              key={axis.attribute}
              data-attribute-axis={axis.attribute}
              className="flex items-center gap-3 py-2.5"
            >
              <Icon
                name={axis.icon}
                size="lg"
                className={cn('bg-current', TONE_TEXT_CLASSES[axis.tone])}
              />
              <dt className="min-w-0 flex-1 truncate font-display text-base text-text">
                {axis.label}
              </dt>
              <dd className="flex items-center gap-2">
                <span className="w-8 text-right font-display font-medium tabular-nums text-text">
                  {value}
                </span>
                {respeccing ? (
                  <Button
                    variant="icon"
                    aria-label={`Decrease ${axis.label}`}
                    disabled={value <= 0}
                    onClick={() => onDraftChange({ ...points, [axis.attribute]: value - 1 })}
                  >
                    <Minus aria-hidden="true" className="size-4" />
                  </Button>
                ) : null}
                <Button
                  variant="icon"
                  data-availability={canIncrease ? 'available' : undefined}
                  className="data-[availability=available]:border-accent-strong data-[availability=available]:text-accent-strong data-[availability=available]:shadow-glow-accent"
                  aria-label={`Increase ${axis.label}`}
                  disabled={!canIncrease}
                  onClick={() =>
                    respeccing
                      ? onDraftChange({ ...points, [axis.attribute]: value + 1 })
                      : onSpend(axis.attribute)
                  }
                >
                  <Plus aria-hidden="true" className="size-4" />
                </Button>
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/50 pt-2">
        {respeccing ? (
          <p
            className="flex min-w-0 items-center gap-1.5 text-sm"
            data-testid="heroes-respec-draft"
          >
            <span className="sr-only">Cost {formatNumber(cost)} Gold</span>
            <span aria-hidden="true" className="shrink-0 text-text-muted">
              Cost
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0 font-medium tabular-nums',
                affordable ? 'text-gold' : 'text-danger',
              )}
            >
              {formatNumber(cost)}
            </span>
            <Coins
              aria-hidden="true"
              className={cn('size-4 shrink-0', affordable ? 'text-gold' : 'text-danger')}
            />
          </p>
        ) : (
          <span />
        )}
        <span className="flex shrink-0 items-center gap-2">
          {respeccing ? (
            <>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-3 py-1.5 text-sm"
                aria-label="Cancel respec"
                onClick={onCancelRespec}
              >
                <X aria-hidden="true" className="size-4" />
                CANCEL
              </Button>
              <Button
                variant="primary"
                className="flex items-center gap-2 px-3 py-1.5 text-sm"
                aria-label="Confirm respec"
                disabled={refunded === 0 || !affordable}
                title={affordable ? undefined : 'Not enough Gold for this redistribution.'}
                onClick={onConfirmRespec}
              >
                <Check aria-hidden="true" className="size-4" />
                CONFIRM
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
              aria-label="Respec attributes"
              onClick={onStartRespec}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              RESPEC
            </Button>
          )}
        </span>
      </div>
    </Panel>
  );
}
