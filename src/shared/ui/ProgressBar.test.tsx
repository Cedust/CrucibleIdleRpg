// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('zeigt Health und Barrier getrennt und nutzt Inline-Styles nur für deren Breite', () => {
    const { container } = render(<ProgressBar label="Korvin" value={50} max={100} barrier={25} />);

    expect(screen.getByRole('progressbar', { name: 'Korvin health' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByRole('progressbar', { name: 'Korvin barrier' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    );
    expect(screen.getByText('Barrier 25')).toBeInTheDocument();

    const styledElements = [...container.querySelectorAll<HTMLElement>('[style]')];
    expect(styledElements).toHaveLength(2);
    expect(styledElements.map((element) => element.getAttribute('style'))).toEqual([
      'width: 50%;',
      'width: 25%;',
    ]);
  });
});
