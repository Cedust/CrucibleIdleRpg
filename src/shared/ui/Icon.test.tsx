// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('ist ohne Label dekorativ und für Screenreader verborgen', () => {
    const { container } = render(<Icon name="melting-metal" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const icon = container.firstElementChild as HTMLElement;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('bg-accent', 'size-6');
  });

  it('wird mit Label zum benannten Bild', () => {
    render(<Icon name="melting-metal" size="sm" label="Crucible" className="bg-ember" />);

    const icon = screen.getByRole('img', { name: 'Crucible' });
    expect(icon).not.toHaveAttribute('aria-hidden');
    expect(icon).toHaveClass('bg-ember', 'size-4');
  });
});
