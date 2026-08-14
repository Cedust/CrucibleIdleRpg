// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScreenHeader } from './ScreenHeader';

describe('ScreenHeader', () => {
  it('rendert Titel als Display-Heading und Intro in font-intro', () => {
    render(<ScreenHeader title="Dungeons" intro="Hinab in die Tiefe." />);

    const heading = screen.getByRole('heading', { name: 'Dungeons' });
    expect(heading).toHaveClass('font-display', 'text-display-lg', 'text-accent-strong');
    expect(screen.getByText('Hinab in die Tiefe.')).toHaveClass('font-intro');
  });

  it('rendert ohne Intro keinen Absatz und reicht Kinder durch', () => {
    const { container } = render(
      <ScreenHeader title="Crucible" className="mb-6">
        <p>3 Relic Shards</p>
      </ScreenHeader>,
    );

    expect(container.querySelector('header')).toHaveClass('mb-6');
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(screen.getByText('3 Relic Shards')).toBeInTheDocument();
  });
});
