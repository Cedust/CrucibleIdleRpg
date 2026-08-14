import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('fügt Klassen mit einfachem Leerzeichen zusammen', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filtert false, null, undefined und leere Strings', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('liefert ohne Argumente einen leeren String', () => {
    expect(cn()).toBe('');
  });

  it('trägt bedingte Klassen nur bei truthy Bedingung', () => {
    const selected = true;
    const locked = false;
    expect(cn('base', selected && 'ring-2', locked && 'opacity-50')).toBe('base ring-2');
  });
});
