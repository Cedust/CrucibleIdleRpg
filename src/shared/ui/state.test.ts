import { describe, expect, it } from 'vitest';

import {
  focusRing,
  groupHoverBorder,
  hoverBorder,
  selectedRing,
  selectedSurface,
  stateAttrs,
  transitionState,
} from './state';

describe('stateAttrs', () => {
  it('liefert ohne Props keine Attribute', () => {
    expect(stateAttrs({})).toEqual({});
  });

  it('setzt data-selected nur bei selected: true', () => {
    expect(stateAttrs({ selected: true })).toEqual({ 'data-selected': '' });
    expect(stateAttrs({ selected: false })).toEqual({});
  });

  it('setzt data-semantic für locked und empty, nicht für normal', () => {
    expect(stateAttrs({ semantic: 'locked' })).toEqual({ 'data-semantic': 'locked' });
    expect(stateAttrs({ semantic: 'empty' })).toEqual({ 'data-semantic': 'empty' });
    expect(stateAttrs({ semantic: 'normal' })).toEqual({});
  });

  it('kombiniert beide Achsen', () => {
    expect(stateAttrs({ selected: true, semantic: 'locked' })).toEqual({
      'data-selected': '',
      'data-semantic': 'locked',
    });
  });
});

describe('kanonische Fragmente', () => {
  it('focusRing nutzt den Focus-Standard aus FOUNDATION §6', () => {
    expect(focusRing).toBe(
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus',
    );
  });

  it('selectedRing und selectedSurface hängen an data-selected', () => {
    expect(selectedRing).toBe('data-selected:ring-2 data-selected:ring-state-selected');
    expect(selectedSurface).toBe(
      'data-selected:bg-state-selected-tint data-selected:shadow-glow-accent',
    );
  });

  it('hoverBorder-Fragmente sparen locked aus', () => {
    expect(hoverBorder).toBe('not-data-[semantic=locked]:hover:border-ornament');
    expect(groupHoverBorder).toBe('group-[:hover:not([data-semantic=locked])]:border-ornament');
  });

  it('transitionState kombiniert die Utility mit motion-reduce', () => {
    expect(transitionState).toBe('transition-state motion-reduce:transition-none');
  });
});
