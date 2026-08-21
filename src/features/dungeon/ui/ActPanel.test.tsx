// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ActDisplayMeta } from '@/game/encounters/actMeta';
import { ActPanel } from './ActPanel';

const ACT_ONE: ActDisplayMeta = {
  id: 'act-1',
  label: 'ACT I',
  name: 'The Ashen Depths',
  backgroundId: 'ashen-depths',
  hasContent: true,
};

const ACT_TWO: ActDisplayMeta = {
  id: 'act-2',
  label: 'ACT II',
  name: 'The Ember Foundry',
  backgroundId: 'ember-foundry',
  hasContent: false,
};

function renderPanel(act: ActDisplayMeta, selected: boolean) {
  return render(
    <ul>
      <ActPanel act={act} selected={selected} />
    </ul>,
  );
}

describe('ActPanel', () => {
  it('zeigt den gewählten Content-Akt mit Glow, Medaillon-Numerale und Akt-Art', () => {
    renderPanel(ACT_ONE, true);

    const panel = screen.getByRole('listitem');
    expect(panel).toHaveAttribute('aria-current', 'true');
    expect(panel).toHaveAttribute('data-selected');
    expect(panel).toHaveClass('h-act-panel');

    const frame = panel.querySelector('.border-image-standard');
    expect(frame).toHaveClass('drop-shadow-glow-accent');

    const medallion = panel.querySelector('img');
    expect(medallion).toHaveAttribute('src', '/assets/frames/medallion-act.png');
    expect(medallion).toHaveClass('size-medallion-sm');
    const numeral = screen.getByText('I');
    expect(numeral.closest('[aria-hidden="true"]')).toContainElement(medallion);

    expect(screen.getByText('ACT I').closest('p')).toHaveClass('text-accent-strong');
    expect(screen.getByText('The Ashen Depths')).toBeInTheDocument();
    expect(screen.queryByText('Locked')).not.toBeInTheDocument();

    const art = panel.querySelector('.bg-cover');
    expect(art).toHaveClass('bg-[url(/assets/backgrounds/dungeon-ashen-depths_2.png)]');
    expect(art).not.toHaveClass('grayscale-50');
  });

  it('dimmt gesperrte Akte und zeigt den Lock-Indikator am Label', () => {
    renderPanel(ACT_TWO, false);

    const panel = screen.getByRole('listitem');
    expect(panel).toHaveAttribute('data-semantic', 'locked');
    expect(panel).not.toHaveAttribute('aria-current');

    const art = panel.querySelector('.bg-cover');
    expect(art).toHaveClass('opacity-(--state-deemphasis-medium)', 'grayscale-50');
    expect(panel.querySelector('.border-image-standard')).toHaveClass(
      'opacity-(--state-deemphasis-strong)',
    );

    const lockLabel = screen.getByText('Locked');
    expect(lockLabel).toHaveClass('sr-only');
    expect(lockLabel.previousElementSibling?.tagName).toBe('svg');
    expect(lockLabel.closest('p')).toContainElement(screen.getByText('ACT II'));
    expect(screen.getByText('ACT II').closest('p')).toHaveClass('text-text-muted');

    expect(screen.getByText('II')).toBeInTheDocument();
  });

  it('behält bei gesperrter Auswahl den vollen Rahmen über gedimmter Art', () => {
    renderPanel(ACT_TWO, true);

    const panel = screen.getByRole('listitem');
    expect(panel).toHaveAttribute('aria-current', 'true');
    expect(panel.querySelector('.border-image-standard')).toHaveClass('drop-shadow-glow-accent');
    expect(panel.querySelector('.bg-cover')).toHaveClass('opacity-(--state-deemphasis-medium)');
  });
});
