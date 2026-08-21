// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { SigilCodexScreen } from './SigilCodexScreen';

describe('SigilCodexScreen', () => {
  beforeEach(() => {
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
  });

  it('renders the currently unlocked act as sealed Codex folios', () => {
    render(<SigilCodexScreen />);

    expect(screen.getByRole('heading', { name: 'Sigil Codex' })).toBeInTheDocument();
    expect(screen.getByText('ACT I · THE ASHEN DEPTHS')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByText('Unrevealed Sigil')).toHaveLength(5);
    expect(screen.queryByText('ACT II · THE EMBER FOUNDRY')).not.toBeInTheDocument();
    expect(screen.getByLabelText('0 of 18 sigils recovered')).toBeInTheDocument();
  });

  it('reveals a known Sigil with level, imprint and slot bindings', () => {
    const save = createDefaultSave(42);
    saveStore.setState({
      data: { ...save, sigils: { 'sigil.tempered-edge': 3 } },
      status: 'ready',
    });

    const { container } = render(<SigilCodexScreen />);

    const entry = container.querySelector('[data-sigil-id="sigil.tempered-edge"]');
    expect(entry).toHaveAttribute('data-known', 'true');
    expect(screen.getByRole('heading', { name: 'Sigil of Tempered Edge' })).toBeInTheDocument();
    expect(screen.getByLabelText('Level 3 of 5')).toBeInTheDocument();
    expect(screen.getByText('Weapon Base Damage')).toBeInTheDocument();
    expect(screen.getByText('BOUND TO Chest · Legs')).toBeInTheDocument();
    expect(screen.getByText('Source A1-D1-20')).toBeInTheDocument();
  });
});
