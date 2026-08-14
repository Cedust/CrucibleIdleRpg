// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FramedCard } from './FramedCard';

const ART = 'bg-[url(/assets/backgrounds/dungeon-ashen-depths.png)]';

describe('FramedCard', () => {
  it('rendert Art-, Scrim- und Frame-Layer mit gedimmtem Frame im Normalzustand', () => {
    const { container } = render(
      <FramedCard artClassName={ART}>
        <span>Inhalt</span>
      </FramedCard>,
    );

    const [art, scrim, frame] = container.querySelectorAll('[aria-hidden="true"]');
    expect(art).toHaveClass(ART);
    expect(scrim).toHaveClass('bg-linear-to-t');
    expect(frame).toHaveClass('border-image-thin', 'opacity-(--state-deemphasis-weak)');
    expect(frame).not.toHaveClass('shadow-glow-accent');
  });

  it('dimmt bei locked ausschließlich den Art-Layer und den Frame', () => {
    const { container } = render(
      <FramedCard artClassName={ART} semantic="locked">
        <span>Inhalt</span>
      </FramedCard>,
    );

    expect(container.firstElementChild).toHaveAttribute('data-semantic', 'locked');
    const [art, , frame] = container.querySelectorAll('[aria-hidden="true"]');
    expect(art).toHaveClass('opacity-(--state-deemphasis-medium)', 'grayscale-50');
    expect(frame).toHaveClass('opacity-(--state-deemphasis-strong)');
    expect(frame).not.toHaveClass('group-hover:opacity-90');
  });

  it('trägt bei selected den Frame in voller Stärke mit Glow und ohne Scrim', () => {
    const { container } = render(
      <FramedCard artClassName={ART} selected>
        <span>Inhalt</span>
      </FramedCard>,
    );

    expect(container.firstElementChild).toHaveAttribute('data-selected');
    const [, scrim, frame] = container.querySelectorAll('[aria-hidden="true"]');
    expect(scrim).not.toHaveClass('bg-linear-to-t');
    expect(frame).toHaveClass('shadow-glow-accent');
    expect(frame).not.toHaveClass('opacity-(--state-deemphasis-weak)');
  });

  it('zeigt highlight ohne Glow und ohne Hover-Affordance', () => {
    const { container } = render(
      <FramedCard as="li" artClassName={ART} highlight interactive={false} aria-current="true">
        <span>Akt I</span>
      </FramedCard>,
    );

    const root = container.firstElementChild;
    expect(root?.tagName).toBe('LI');
    expect(root).toHaveAttribute('aria-current', 'true');
    const [, scrim, frame] = container.querySelectorAll('[aria-hidden="true"]');
    expect(scrim).not.toHaveClass('bg-linear-to-t');
    expect(frame).not.toHaveClass('shadow-glow-accent');
    expect(frame).not.toHaveClass('group-hover:opacity-90');
  });
});
