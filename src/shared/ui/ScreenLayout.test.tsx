// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScreenLayout } from './ScreenLayout';

describe('ScreenLayout', () => {
  it('rendert das gewählte Element mit Hintergrund- und Kontrast-Layer als dekorativ', () => {
    const { container } = render(
      <ScreenLayout as="main" background="ashen-depths">
        <h1>Dungeons</h1>
      </ScreenLayout>,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dungeons' })).toBeInTheDocument();
    const layers = container.querySelectorAll('[aria-hidden="true"]');
    expect(layers).toHaveLength(2);
  });

  it('rendert ohne background-Prop keine Layer', () => {
    const { container } = render(
      <ScreenLayout>
        <p>Content</p>
      </ScreenLayout>,
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it('unterstützt den Crucible-Hintergrund mit eigenem Kontrast-Overlay', () => {
    const { container } = render(
      <ScreenLayout background="crucible">
        <h1>Crucible</h1>
      </ScreenLayout>,
    );

    expect(container.querySelector('[data-screen-background="crucible"]')).toHaveClass(
      'bg-[url(/assets/backgrounds/crucible-view.png)]',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')[1]).toHaveClass('bg-background/28');
  });
});
