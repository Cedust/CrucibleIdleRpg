import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { AppShell } from './AppShell';
import { useNavigationStore } from './navigationStore';

describe('AppShell', () => {
  beforeEach(() => {
    useNavigationStore.setState({ activeView: 'dungeons' });
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
  });

  it('zeigt Markenbereich, Ressourcen und die zugÃ¤ngliche PrimÃ¤rnavigation', () => {
    render(<AppShell />);

    expect(screen.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeInTheDocument();
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent('0');
    expect(screen.getByLabelText('Crystals amount')).toHaveTextContent('0');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  });

  it('zeigt standardmäßig den Dungeons-View mit dem Kampfbildschirm', () => {
    render(<AppShell />);
    expect(screen.getByRole('button', { name: 'DUNGEONS' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('heading', { name: 'Combat' })).toBeInTheDocument();
  });

  it('wechselt den View per Navigationsklick', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole('button', { name: 'RUNES' }));

    expect(screen.getByRole('heading', { name: 'RUNES' })).toBeInTheDocument();
    expect(useNavigationStore.getState().activeView).toBe('runes');
  });
});
