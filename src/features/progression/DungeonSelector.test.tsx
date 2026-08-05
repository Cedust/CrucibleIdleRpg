import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { DungeonSelector } from './DungeonSelector';

describe('DungeonSelector', () => {
  it('shows only unlocked checkpoints and reports the accessible selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const save = { ...createDefaultSave(1), unlockedDungeonIds: ['A1-D1', 'A1-D3'] as const };
    render(<DungeonSelector save={save} selectedDungeonId="A1-D1" onSelect={onSelect} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['A1-D1', 'A1-D3']);
    expect(radios[0]).toBeChecked();

    await user.click(radios[1] as HTMLInputElement);
    expect(onSelect).toHaveBeenCalledWith('A1-D3');
  });
});
