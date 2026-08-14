// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NodeInspectorPanel } from './NodeInspectorPanel';

function renderPanel(overrides: Partial<Parameters<typeof NodeInspectorPanel>[0]> = {}) {
  return render(
    <NodeInspectorPanel
      label="Crucible node inspector"
      medallion={<span data-testid="medallion-icon" />}
      title="Overpower"
      rankCaption="Rank 1 / 3"
      rank={1}
      maxRank={3}
      effect="+10% damage per rank."
      lockReason={null}
      lockReasonId="crucible-lock-reason"
      onAction={vi.fn()}
      {...overrides}
    >
      <dl data-testid="details" />
    </NodeInspectorPanel>,
  );
}

describe('NodeInspectorPanel', () => {
  it('rendert Landmark, Titel, Rangzeile, Effekt und Detail-Slot', () => {
    renderPanel();

    const inspector = screen.getByRole('complementary', { name: 'Crucible node inspector' });
    expect(inspector).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overpower' })).toBeInTheDocument();
    expect(screen.getByText('Rank 1 / 3')).toBeInTheDocument();
    expect(screen.getByText('+10% damage per rank.')).toBeInTheDocument();
    expect(screen.getByTestId('details')).toBeInTheDocument();
    expect(screen.getByTestId('medallion-icon')).toBeInTheDocument();
  });

  it('löst die Aktion über den Standard-Button aus', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderPanel({ onAction });

    await user.click(screen.getByRole('button', { name: 'Invest' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('deaktiviert die Aktion und verdrahtet den Sperrgrund als Beschreibung', () => {
    renderPanel({ lockReason: 'Not enough Relic Shards.' });

    const action = screen.getByRole('button', { name: 'Invest' });
    expect(action).toBeDisabled();
    expect(action).toHaveAccessibleDescription('Not enough Relic Shards.');
    expect(screen.getByText('Not enough Relic Shards.')).toHaveAttribute(
      'id',
      'crucible-lock-reason',
    );
  });

  it('erlaubt ein abweichendes Action-Label', () => {
    renderPanel({ actionLabel: 'Equip' });
    expect(screen.getByRole('button', { name: 'Equip' })).toBeInTheDocument();
  });
});
