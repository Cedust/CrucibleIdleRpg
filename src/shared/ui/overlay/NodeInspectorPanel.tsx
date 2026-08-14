import type { ReactNode } from 'react';
import { Button } from '../controls/Button';
import { RankPips } from '../tree/NodeMedallion';
import { Panel } from '../layout/Panel';

interface NodeInspectorPanelProps {
  /** aria-label der Inspector-Landmark. */
  label: string;
  /** Icon innerhalb des Glut-Roundels. */
  medallion: ReactNode;
  title: string;
  /** Rang-Unterzeile, z. B. „Rank 2 / 5 · Next rank 3". */
  rankCaption: string;
  rank: number;
  maxRank: number;
  effect: string;
  /** Beschreibt als `aria-describedby` den deaktivierten Action-Button. */
  lockReason: string | null;
  lockReasonId: string;
  actionLabel?: string;
  onAction: () => void;
  /** Feature-Detailzeilen (dl) und Hinweis-Absätze. */
  children?: ReactNode;
}

/**
 * Detailansicht eines gewählten Tree-Nodes: Glut-Roundel, Rang, Effekt,
 * Feature-Details und die explizite Kauf-Aktion (FOUNDATION §7).
 */
export function NodeInspectorPanel({
  label,
  medallion,
  title,
  rankCaption,
  rank,
  maxRank,
  effect,
  lockReason,
  lockReasonId,
  actionLabel = 'Invest',
  onAction,
  children,
}: NodeInspectorPanelProps) {
  return (
    <Panel as="aside" variant="thin" padding="none" className="min-w-0" aria-label={label}>
      <div className="p-5">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-24 items-center justify-center rounded-full border-2 border-ornament bg-ember/10 text-ember-bright shadow-glow-accent">
            {medallion}
          </span>
          <h3 className="mt-4 font-display text-display text-accent-strong">{title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {rankCaption}
          </p>
          <div className="mt-2">
            <RankPips rank={rank} maxRank={maxRank} />
          </div>
        </div>

        <p className="mt-5 border-y border-border/70 py-4 text-sm leading-6 text-text-muted">
          {effect}
        </p>
        {children}
        {lockReason !== null ? (
          <p id={lockReasonId} className="mt-4 text-sm text-warning">
            {lockReason}
          </p>
        ) : null}
        <Button
          className="mt-5 w-full"
          disabled={lockReason !== null}
          aria-describedby={lockReason !== null ? lockReasonId : undefined}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
    </Panel>
  );
}
