import { cn } from '../utils/cn';

type DividerVariant = 'ornate' | 'thin';

/* Statische Klassen-Strings, damit Tailwind die bg-Utilities beim Scan findet (Rezept der
   Icon-Masken). Das Ornament liegt als CSS-Background und nicht als <img> auf dem Streifen: Ein
   fehlendes Background-Bild rendert nichts, ein fehlendes <img> dagegen den
   Broken-Image-Platzhalter des Browsers. Die Höhe steht hier, weil sie zur Variante gehört. */
const VARIANT_CLASSES: Record<DividerVariant, string> = {
  ornate: 'h-7 bg-[url(/assets/ornaments/divider-ornate.png)]',
  thin: 'h-4 bg-[url(/assets/ornaments/divider-thin.png)]',
};

interface DividerProps {
  /**
   * `ornate` trägt das große Ornament der Sidebar, `thin` den feinen Trenner zwischen Gruppen.
   * Die Höhe des Streifens gehört zur Variante, weil `cn()` keine Merge-Logik trägt (UI.md §7).
   */
  variant?: DividerVariant;
  /** Ränder des Streifens; die Fläche selbst kommt aus der Variante. */
  className?: string;
}

/**
 * Waagerechtes Ornament zwischen Inhalten. Das Asset läuft über die volle Breite und wird auf die
 * Höhe des Streifens beschnitten; die spitz auslaufenden Enden lassen es in jeder Breite
 * freistehend wirken.
 */
export function Divider({ variant = 'ornate', className }: DividerProps) {
  return (
    <div
      aria-hidden="true"
      data-divider={variant}
      className={cn('bg-center bg-cover bg-no-repeat', VARIANT_CLASSES[variant], className)}
    />
  );
}
