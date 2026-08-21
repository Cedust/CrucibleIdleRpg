// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { Divider } from './Divider';

describe('Divider', () => {
  it('trägt das Ornament dekorativ als Background über die volle Breite', () => {
    const { container } = render(<Divider />);
    const divider = container.firstElementChild as HTMLElement;

    expect(divider).toHaveAttribute('aria-hidden', 'true');
    expect(divider).toHaveAttribute('data-divider', 'ornate');
    expect(divider).toHaveClass(
      'bg-[url(/assets/ornaments/divider-ornate.png)]',
      'bg-cover',
      'bg-center',
      'h-7',
    );
    // Ein Background statt eines <img>: ein fehlendes Asset rendert nichts statt eines Platzhalters.
    expect(divider.querySelector('img')).toBeNull();
  });

  it('wechselt für den feinen Trenner das Asset und trägt die Haarlinie als Fallback', () => {
    const { container } = render(<Divider variant="thin" className="my-2" />);
    const divider = container.firstElementChild as HTMLElement;

    expect(divider).toHaveAttribute('data-divider', 'thin');
    expect(divider).toHaveClass('bg-[url(/assets/ornaments/divider-thin.png)]', 'h-4', 'my-2');
    // Die Höhe gehört zur Variante; className trägt nur die Ränder (UI.md §7).
    expect(divider).not.toHaveClass('h-7');
  });
});
