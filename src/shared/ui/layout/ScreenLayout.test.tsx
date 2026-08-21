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

  it('unterstützt den Dungeons-Hintergrund mit lesbarem Kontrast-Overlay', () => {
    const { container } = render(
      <ScreenLayout background="dungeons">
        <h1>Dungeons</h1>
      </ScreenLayout>,
    );

    expect(container.querySelector('[data-screen-background="dungeons"]')).toHaveClass(
      'bg-[url(/assets/backgrounds/dungeons-view.png)]',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')[1]).toHaveClass('bg-background/28');
  });

  it('unterstützt den Heroes-Hintergrund mit lesbarem Kontrast-Overlay', () => {
    const { container } = render(
      <ScreenLayout background="heroes">
        <h1>Heroes</h1>
      </ScreenLayout>,
    );

    expect(container.querySelector('[data-screen-background="heroes"]')).toHaveClass(
      'bg-[url(/assets/backgrounds/heroes-view.png)]',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')[1]).toHaveClass('bg-background/28');
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

  it('unterstützt den Weapon-Mastery-Hintergrund mit lesbarem Kontrast-Overlay', () => {
    const { container } = render(
      <ScreenLayout background="weapon-mastery">
        <h1>Weapon Mastery</h1>
      </ScreenLayout>,
    );

    expect(container.querySelector('[data-screen-background="weapon-mastery"]')).toHaveClass(
      'bg-[url(/assets/backgrounds/weapon-mastery-view.png)]',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')[1]).toHaveClass('bg-background/28');
  });

  it('unterstützt den Blacksmith-Hintergrund mit lesbarem Kontrast-Overlay', () => {
    const { container } = render(
      <ScreenLayout background="blacksmith">
        <h1>Blacksmith</h1>
      </ScreenLayout>,
    );

    expect(container.querySelector('[data-screen-background="blacksmith"]')).toHaveClass(
      'bg-[url(/assets/backgrounds/blacksmith-view.png)]',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')[1]).toHaveClass('bg-background/28');
  });

  it('unterstützt den Rune-Grimoire-Hintergrund mit lesbarem Kontrast-Overlay', () => {
    const { container } = render(
      <ScreenLayout background="rune-grimoire">
        <h1>Rune Grimoire</h1>
      </ScreenLayout>,
    );

    expect(container.querySelector('[data-screen-background="rune-grimoire"]')).toHaveClass(
      'bg-[url(/assets/backgrounds/rune-grimoire-view.png)]',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')[1]).toHaveClass('bg-background/28');
  });

  it('unterstützt den Runescribe-Hintergrund mit lesbarem Kontrast-Overlay', () => {
    const { container } = render(
      <ScreenLayout background="runescribe">
        <h1>Runescribe</h1>
      </ScreenLayout>,
    );

    expect(container.querySelector('[data-screen-background="runescribe"]')).toHaveClass(
      'bg-[url(/assets/backgrounds/runescribe-view.png)]',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')[1]).toHaveClass('bg-background/28');
  });

  it('rendert full-height und scrollt per Default im Content-Wrapper', () => {
    render(
      <ScreenLayout as="main">
        <p>Content</p>
      </ScreenLayout>,
    );

    const root = screen.getByRole('main');
    expect(root).toHaveClass('h-full', 'min-h-0');
    const contentWrapper = screen.getByText('Content').parentElement;
    expect(contentWrapper).toHaveClass('@container', 'overflow-y-auto');
  });

  it('überlässt mit scroll={false} das Scrollen dem Screen', () => {
    render(
      <ScreenLayout scroll={false}>
        <p>Content</p>
      </ScreenLayout>,
    );

    const contentWrapper = screen.getByText('Content').parentElement;
    expect(contentWrapper).toHaveClass('@container');
    expect(contentWrapper).not.toHaveClass('overflow-y-auto');
  });
});
