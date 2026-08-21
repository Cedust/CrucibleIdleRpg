// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CharacterPortal } from './CharacterPortal';

describe('CharacterPortal', () => {
  it('starts the backdrop above the arch tip and the figure at it', () => {
    render(<CharacterPortal characterId="korvin" />);

    const portal = screen.getByTestId('heroes-portal-frame');
    const backdrop = portal.querySelector('[data-character-part="backdrop"]');
    const figure = screen.getByAltText('Korvin figure');

    // Die Hintergrundfläche läuft hinter den Stein über dem Bogen, damit die Öffnung bis an den
    // Rahmen gefüllt ist; die Bogenform schneidet das Rahmen-Asset aus.
    expect(backdrop).toHaveClass('top-[12%]');
    expect(backdrop?.className).not.toMatch(/rounded/);
    // Die Figur hat ihre eigene Box ab der Bogenspitze, damit ihr Kopf nicht in den Rahmen ragt.
    expect(figure.parentElement).toHaveClass('top-[22.1%]');
    // Rahmen über Hintergrund und Figur, Name über dem Rahmen.
    expect(portal.querySelector('[data-character-part="frame"]')).toHaveClass('z-10');
    expect(portal.querySelector('[data-character-part="name"]')).toHaveClass('z-20');
  });
});
