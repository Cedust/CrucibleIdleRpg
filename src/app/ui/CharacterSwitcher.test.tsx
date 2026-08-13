// @vitest-environment jsdom
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { CharacterId } from '@/game/types';
import { CharacterSwitcher } from './CharacterSwitcher';

function ControlledCharacterSwitcher() {
  const [activeCharacterId, setActiveCharacterId] = useState<CharacterId>('korvin');
  return (
    <CharacterSwitcher activeCharacterId={activeCharacterId} onSelect={setActiveCharacterId} />
  );
}

describe('CharacterSwitcher', () => {
  it('uses a radiogroup with a non-color-only active marker and changes on click', async () => {
    const user = userEvent.setup();
    render(<ControlledCharacterSwitcher />);

    const group = screen.getByRole('radiogroup', { name: 'Active character' });
    expect(screen.getByRole('radio', { name: 'Korvin' })).toHaveAttribute('aria-checked', 'true');
    expect(group.querySelector('[aria-hidden="true"]')).toHaveClass('bg-accent');

    await user.click(screen.getByRole('radio', { name: 'Rhaya' }));

    expect(screen.getByRole('radio', { name: 'Korvin' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Rhaya' })).toHaveAttribute('aria-checked', 'true');
  });

  it('supports roving focus with arrow keys, Home, and End', async () => {
    const user = userEvent.setup();
    render(<ControlledCharacterSwitcher />);

    const korvin = screen.getByRole('radio', { name: 'Korvin' });
    korvin.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Rhaya' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Rhaya' })).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: 'Quinn' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(korvin).toHaveFocus();
  });
});
