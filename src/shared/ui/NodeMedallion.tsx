import type { ReactNode } from 'react';
import { cn } from './cn';
import { groupHoverBorder, transitionState } from './state';

type NodeMedallionSize = 'md' | 'lg';

const SIZE_CLASS: Record<NodeMedallionSize, string> = {
  md: 'size-medallion-sm',
  lg: 'size-medallion',
};

interface NodeMedallionProps {
  /** `md` = Branch- und Mastery-Medaillon, `lg` = Standard-Crucible-Medaillon. */
  size?: NodeMedallionSize;
  /** Investierte Ränge färben die Fläche mit Glut. */
  invested?: boolean;
  /** `data-node-medallion`-Hook für die SVG-Connector-Messung der Tree-Graphen. */
  nodeId: string;
  /** Icon plus optionale Badge-Overlays. */
  children: ReactNode;
}

/**
 * Medaillon der Node-Buttons (FOUNDATION §7). Der State kommt vollständig vom
 * Group-Element: `data-availability` färbt die Akzente, `data-semantic="locked"`
 * dimmt ausschließlich diesen Art-Layer, `data-selected` trägt den
 * Selection-Ring — auch auf gesperrten Nodes (FOUNDATION §6).
 */
export function NodeMedallion({
  size = 'lg',
  invested = false,
  nodeId,
  children,
}: NodeMedallionProps) {
  return (
    <span
      data-node-medallion={nodeId}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface-raised/90',
        SIZE_CLASS[size],
        invested && 'bg-ember/15',
        transitionState,
        groupHoverBorder,
        'group-data-[availability=available]:border-accent-strong group-data-[availability=available]:text-accent-strong group-data-[availability=available]:shadow-glow-accent',
        'group-data-[availability=insufficient]:border-border group-data-[availability=insufficient]:text-text',
        'group-data-[availability=max]:border-accent group-data-[availability=max]:text-accent-strong group-data-[availability=max]:shadow-glow-accent',
        'group-data-[semantic=locked]:border-state-locked-border group-data-[semantic=locked]:text-text-muted group-data-[semantic=locked]:opacity-(--state-deemphasis-medium) group-data-[semantic=locked]:grayscale-50',
        'group-data-selected:ring-2 group-data-selected:ring-state-selected group-data-selected:ring-offset-3 group-data-selected:ring-offset-surface',
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-1 rounded-full border border-ornament/40"
      />
      {children}
    </span>
  );
}

interface RankPipsProps {
  rank: number;
  maxRank: number;
}

/** Rang-Pips unter dem Medaillon; investierte Pips glühen leicht. */
export function RankPips({ rank, maxRank }: RankPipsProps) {
  return (
    <span aria-hidden="true" className="flex items-center justify-center gap-1">
      {Array.from({ length: maxRank }, (_, index) => (
        <span
          key={index}
          className={cn(
            'size-2 rotate-45 border',
            index < rank
              ? 'border-accent-strong bg-accent-strong shadow-glow-accent-sm'
              : 'border-border bg-background',
          )}
        />
      ))}
    </span>
  );
}
