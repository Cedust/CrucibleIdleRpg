// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it.each([
    ['health', 'Korvin health', 'from-danger/80 to-danger'],
    ['barrier', 'Korvin barrier', 'from-info/80 to-info'],
    ['xp', 'Korvin experience', 'from-arcane/80 to-arcane'],
  ] as const)('renders the %s tone as an accessible single bar', (tone, ariaLabel, toneClass) => {
    const { container } = render(
      <ProgressBar
        label="Health"
        ariaLabel={ariaLabel}
        value={50}
        max={100}
        tone={tone}
        size="sm"
      />,
    );

    expect(screen.getByRole('progressbar', { name: ariaLabel })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(container.innerHTML).toContain('h-1.5');
    expect(container.innerHTML).toContain(toneClass);
  });

  it('uses an explicit display value while retaining the numeric accessibility value', () => {
    render(<ProgressBar label="XP" value={0} max={0} valueText="MAX" tone="xp" />);

    expect(screen.getByText('MAX')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'XP' })).toHaveAttribute('aria-valuemax', '0');
  });

  it('can omit the visible label while retaining the accessible name', () => {
    render(
      <ProgressBar label="Health" ariaLabel="Slag Bulwark health" value={80} max={100} hideLabel />,
    );

    expect(screen.queryByText('Health')).not.toBeInTheDocument();
    expect(screen.getByText('80 / 100').parentElement).toHaveClass('justify-center');
    expect(screen.getByRole('progressbar', { name: 'Slag Bulwark health' })).toBeInTheDocument();
  });

  it('supports level labels around a centered XP value', () => {
    render(
      <ProgressBar
        label="Level 1"
        value={18}
        max={75}
        valueText="18/75 XP"
        endLabel="2"
        tone="xp"
      />,
    );

    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('18/75 XP')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
