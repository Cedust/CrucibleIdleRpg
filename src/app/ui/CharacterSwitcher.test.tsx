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
    const radios = screen.getAllByRole('radio');
    const korvin = screen.getByRole('radio', { name: 'Korvin' });
    expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    expect(korvin).toHaveAttribute('aria-checked', 'true');
    expect(korvin.querySelector('[data-character-part="active-marker"]')).toHaveClass('z-0');
    expect(korvin.querySelector('[data-character-part="frame"]')).toHaveClass('z-10');

    await user.click(screen.getByRole('radio', { name: 'Rhaya' }));

    const rhaya = screen.getByRole('radio', { name: 'Rhaya' });
    expect(korvin).toHaveAttribute('aria-checked', 'false');
    expect(korvin.querySelector('[data-character-part="active-marker"]')).not.toBeInTheDocument();
    expect(rhaya).toHaveAttribute('aria-checked', 'true');
    expect(rhaya.querySelector('[data-character-part="active-marker"]')).toBeInTheDocument();
    expect(group.querySelectorAll('[aria-checked="true"]')).toHaveLength(1);
  });

  it('keeps portraits, frames, names, and decorative role icons as separate layers', () => {
    render(<ControlledCharacterSwitcher />);

    expect(document.querySelectorAll('[data-character-part="portrait"]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-character-part="frame"]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-character-part="name"]')).toHaveLength(3);

    const roleIcons = document.querySelectorAll('[data-character-part="role-icon"]');
    expect(roleIcons).toHaveLength(3);
    for (const roleIcon of roleIcons) {
      expect(roleIcon).toHaveAttribute('aria-hidden', 'true');
    }
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
