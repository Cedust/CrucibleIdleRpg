// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACT_1_DISPLAY_META, ACT_DISPLAY_META } from '@/game/encounters/actMeta';
import { ActBanner } from './ActBanner';

const actOne = ACT_1_DISPLAY_META;
const actTwo = ACT_DISPLAY_META.find((act) => act.id === 'act-2');
if (actTwo === undefined) throw new Error('act-2 display meta missing');

function renderBanner(act: (typeof ACT_DISPLAY_META)[number], selected: boolean) {
  render(
    <ul>
      <ActBanner act={act} selected={selected} />
    </ul>,
  );
  return screen.getByRole('listitem');
}

describe('ActBanner', () => {
  it('renders the selected content act with full frame, glow and gold title', () => {
    const banner = renderBanner(actOne, true);

    expect(banner).toHaveAttribute('aria-current', 'true');
    expect(banner).toHaveAttribute('data-selected');
    expect(banner).not.toHaveAttribute('data-semantic');

    const frame = banner.querySelector('.border-image-banner');
    expect(frame).toHaveClass('drop-shadow-glow-accent');
    expect(within(banner).getByText(actOne.label)).toHaveClass('text-accent-strong');
    expect(within(banner).queryByText('Locked')).not.toBeInTheDocument();

    // Asset-Wiring: Akt-Szenerie und Scrim liegen als banner-act-surface unter dem Rahmen.
    const surfaces = banner.querySelectorAll('.banner-act-surface');
    expect(surfaces).toHaveLength(2);
    expect(surfaces[0]).toHaveClass('bg-[url(/assets/backgrounds/dungeon-ashen-depths_2.png)]');
  });

  it('renders a locked act with dimmed art, reduced frame and lock medallion', () => {
    const banner = renderBanner(actTwo, false);

    expect(banner).toHaveAttribute('data-semantic', 'locked');
    expect(banner).not.toHaveAttribute('aria-current');
    expect(banner).not.toHaveAttribute('data-selected');

    const art = banner.querySelectorAll('.banner-act-surface')[0];
    expect(art).toHaveClass('opacity-(--state-deemphasis-medium)', 'grayscale-50');
    expect(banner.querySelector('.border-image-banner')).toHaveClass(
      'opacity-(--state-deemphasis-strong)',
    );

    const lockLabel = within(banner).getByText('Locked');
    expect(lockLabel).toHaveClass('sr-only');
    expect(lockLabel.previousElementSibling?.tagName).toBe('svg');
    expect(lockLabel.parentElement).toHaveClass('rounded-full');
    expect(banner).toHaveTextContent(new RegExp(`Locked.*${actTwo.label}.*${actTwo.name}`));
  });

  it('keeps art dimmed and frame at full strength for a selected locked act', () => {
    const banner = renderBanner(actTwo, true);

    expect(banner).toHaveAttribute('data-selected');
    expect(banner).toHaveAttribute('data-semantic', 'locked');
    expect(banner.querySelectorAll('.banner-act-surface')[0]).toHaveClass(
      'opacity-(--state-deemphasis-medium)',
    );
    expect(banner.querySelector('.border-image-banner')).toHaveClass('drop-shadow-glow-accent');
  });
});
