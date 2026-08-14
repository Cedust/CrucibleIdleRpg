/**
 * Zweiachsiges visuelles State-System (FOUNDATION §5): Interaction-Achse
 * (`selected`; `disabled` läuft nativ) und Semantic-Achse (game-weit).
 * `stateAttrs()` liefert die `data-*`-Attribute, an denen die Tailwind-
 * data-Variants hängen; die kanonischen Fragmente sind die einzige Quelle
 * der gemeinsamen State-Klassen. Feature-Facetten (`data-availability`,
 * `data-defeated`) stylen nur Akzente und leben in ihren Features.
 */

export type SemanticState = 'normal' | 'locked' | 'empty';

export interface VisualStateProps {
  /** Exklusives Highlight (Tab, Node, Card, Character, aktueller Akteur). */
  selected?: boolean;
  /** Game-weiter semantischer Zustand; `normal` setzt kein Attribut. */
  semantic?: SemanticState;
}

export interface StateAttrs {
  'data-selected'?: '';
  'data-semantic'?: Exclude<SemanticState, 'normal'>;
}

export function stateAttrs({
  selected = false,
  semantic = 'normal',
}: VisualStateProps): StateAttrs {
  const attrs: StateAttrs = {};
  if (selected) {
    attrs['data-selected'] = '';
  }
  if (semantic !== 'normal') {
    attrs['data-semantic'] = semantic;
  }
  return attrs;
}

/** Focus-Standard: sichtbarer Außen-Ring (Ausnahmen: FOUNDATION §10). */
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus';

/** Selektion als Ring (Nodes, Cards, Akteure). */
export const selectedRing = 'data-selected:ring-2 data-selected:ring-state-selected';

/** Selektion als Fläche mit Glow (Tabs, Karten ohne Ring). */
export const selectedSurface =
  'data-selected:bg-state-selected-tint data-selected:shadow-glow-accent';

/** Hover-Border-Lift; gesperrte Elemente behalten ihre Locked-Border. */
export const hoverBorder = 'not-data-[semantic=locked]:hover:border-ornament';

/**
 * Wie `hoverBorder` für Kind-Ebenen einer `group`, deren Group-Element die
 * State-Achsen trägt — die einzige Arbitrary-Group-Variant des State-Systems
 * (FOUNDATION §5). Selektierte Elemente behalten ihre Akzent-Border, weil die
 * Variant sonst per Spezifität auch die Facetten-Border übersteuern würde.
 */
export const groupHoverBorder =
  'group-[:hover:not([data-semantic=locked]):not([data-selected])]:border-ornament';

/** State-Übergänge; Property-Liste in `@utility transition-state` (index.css). */
export const transitionState = 'transition-state motion-reduce:transition-none';
