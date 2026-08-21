import { describe, expect, it } from 'vitest';
import { CHARACTER_SCOPED_VIEWS, NAV_GROUPS, VIEWS } from './navigationStore';

describe('sidebar blocks', () => {
  it('lays out every view exactly once, in the order of VIEWS', () => {
    expect(NAV_GROUPS.flat()).toEqual([...VIEWS]);
  });

  it('keeps the character-scoped views in one contiguous block', () => {
    expect(NAV_GROUPS[1]).toEqual([...CHARACTER_SCOPED_VIEWS]);
  });
});
