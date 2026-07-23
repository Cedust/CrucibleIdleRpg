import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';
import { useNavigationStore } from './navigationStore';

describe('AppShell', () => {
  beforeEach(() => {
    useNavigationStore.setState({ activeView: 'combat' });
  });

  it('zeigt standardmäßig den Kampf-View', () => {
    render(<AppShell />);
    expect(screen.getByRole('heading', { name: 'Combat' })).toBeInTheDocument();
  });

  it('wechselt den View per Navigationsklick', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole('button', { name: 'Team' }));

    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument();
    expect(useNavigationStore.getState().activeView).toBe('team');
  });
});
