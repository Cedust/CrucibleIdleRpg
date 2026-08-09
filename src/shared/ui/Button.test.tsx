// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('rendert als type="button" und reicht Klicks und ARIA-Attribute durch', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} aria-pressed="true">
        Toggle
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Toggle' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('erlaubt das Überschreiben des type-Attributs', () => {
    render(<Button type="submit">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
  });

  it('hängt die Caller-className hinter die Variantenklassen', () => {
    render(<Button className="mt-4 w-full">Invest</Button>);

    expect(screen.getByRole('button', { name: 'Invest' })).toHaveClass('mt-4', 'w-full');
  });

  it('unterstützt die Varianten primary, ghost und danger', () => {
    const { rerender } = render(<Button>Enter</Button>);
    expect(screen.getByRole('button', { name: 'Enter' })).toHaveClass('border-ornament');

    rerender(<Button variant="ghost">Enter</Button>);
    expect(screen.getByRole('button', { name: 'Enter' })).toHaveClass('bg-transparent');

    rerender(<Button variant="danger">Enter</Button>);
    expect(screen.getByRole('button', { name: 'Enter' })).toHaveClass('text-danger');
  });

  it('blockiert Klicks im disabled-Zustand', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Locked
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Locked' });
    expect(button).toBeDisabled();
    await userEvent.click(button).catch(() => undefined);
    expect(onClick).not.toHaveBeenCalled();
  });
});
