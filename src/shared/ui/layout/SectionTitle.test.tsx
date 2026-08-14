// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionTitle } from './SectionTitle';

describe('SectionTitle', () => {
  it('rendert zentrierte h2-Titel in Display-Typografie', () => {
    render(<SectionTitle>Heroes</SectionTitle>);

    const heading = screen.getByRole('heading', { level: 2, name: 'Heroes' });
    expect(heading).toHaveClass(
      'font-display',
      'text-display-sm',
      'text-accent-strong',
      'text-center',
    );
  });

  it('unterstützt h3, Start-Ausrichtung und id für aria-labelledby', () => {
    render(
      <SectionTitle as="h3" align="start" id="frontline-heading">
        Frontline
      </SectionTitle>,
    );

    const heading = screen.getByRole('heading', { level: 3, name: 'Frontline' });
    expect(heading).toHaveAttribute('id', 'frontline-heading');
    expect(heading).not.toHaveClass('text-center');
  });
});
