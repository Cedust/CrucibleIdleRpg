import type { KeyboardEvent } from 'react';

interface RovingFocusOptions<T extends string> {
  /** Reihenfolge der Items; bestimmt Pfeiltasten-Navigation und Wrap. */
  items: readonly T[];
  /** Das selektierte Item trägt tabIndex 0, alle anderen -1. */
  selected: T;
  /** Selektion folgt dem Fokus (Tabs- und Radio-Pattern). */
  onSelect: (item: T) => void;
  /** DOM-id eines Items für den programmatischen Fokuswechsel. */
  itemDomId: (item: T) => string;
  /** `horizontal` (Default): Links/Rechts; `both`: zusätzlich Hoch/Runter. */
  orientation?: 'horizontal' | 'both';
}

interface RovingItemProps {
  tabIndex: 0 | -1;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Roving-TabIndex mit Pfeiltasten-Navigation: genau ein Item
 * ist tabbbar, Pfeiltasten bewegen Selektion und Fokus gemeinsam mit Wrap,
 * Home/End springen an die Enden.
 */
export function useRovingFocus<T extends string>({
  items,
  selected,
  onSelect,
  itemDomId,
  orientation = 'horizontal',
}: RovingFocusOptions<T>): (item: T) => RovingItemProps {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, item: T) => {
    const index = items.indexOf(item);
    const isNext =
      event.key === 'ArrowRight' || (orientation === 'both' && event.key === 'ArrowDown');
    const isPrevious =
      event.key === 'ArrowLeft' || (orientation === 'both' && event.key === 'ArrowUp');
    const nextIndex = isNext
      ? (index + 1) % items.length
      : isPrevious
        ? (index - 1 + items.length) % items.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : null;
    if (nextIndex === null) return;
    const next = items[nextIndex];
    if (next === undefined) return;

    event.preventDefault();
    onSelect(next);
    document.getElementById(itemDomId(next))?.focus();
  };

  return (item: T) => ({
    tabIndex: item === selected ? 0 : -1,
    onKeyDown: (event) => handleKeyDown(event, item),
  });
}
