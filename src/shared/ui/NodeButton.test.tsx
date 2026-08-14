// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NodeButton } from './NodeButton';

function renderNode(overrides: Partial<Parameters<typeof NodeButton>[0]> = {}) {
  return render(
    <NodeButton
      nodeId="tree.node"
      name="Overpower"
      effect="+10% damage"
      rank={0}
      maxRank={3}
      availability="available"
      insufficientStatus="Needs 1 Relic Shard"
      selected={false}
      onSelect={vi.fn()}
      {...overrides}
    >
      <span data-testid="node-icon" />
    </NodeButton>,
  );
}

describe('NodeButton', () => {
  it('baut den zugänglichen Namen aus Name, Rang und Status', () => {
    renderNode();
    expect(
      screen.getByRole('button', { name: 'Overpower, rank 0 of 3, Available' }),
    ).toBeInTheDocument();
  });

  it('meldet bei investiertem Rang den nächsten Rang als verfügbar', () => {
    renderNode({ rank: 2 });
    expect(
      screen.getByRole('button', { name: 'Overpower, rank 2 of 3, Next rank available' }),
    ).toBeInTheDocument();
  });

  it('trägt die Facette als data-availability und locked als Semantic-Achse', () => {
    renderNode({ availability: 'max', rank: 3 });
    const max = screen.getByRole('button', { name: 'Overpower, rank 3 of 3, Max' });
    expect(max).toHaveAttribute('data-availability', 'max');
    expect(max).not.toHaveAttribute('data-semantic');
  });

  it('setzt locked auf die Semantic-Achse ohne Facette', () => {
    renderNode({ availability: 'locked' });
    const locked = screen.getByRole('button', { name: 'Overpower, rank 0 of 3, Locked' });
    expect(locked).toHaveAttribute('data-semantic', 'locked');
    expect(locked).not.toHaveAttribute('data-availability');
  });

  it('nutzt den Feature-Text der insufficient-Facette', () => {
    renderNode({ availability: 'insufficient' });
    expect(
      screen.getByRole('button', { name: 'Overpower, rank 0 of 3, Needs 1 Relic Shard' }),
    ).toHaveAttribute('data-availability', 'insufficient');
  });

  it('zeigt das sichtbare Label unabhängig vom zugänglichen Namen', () => {
    renderNode({ visibleLabel: 'OVR' });
    expect(screen.getByText('OVR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Overpower,/ })).toBeInTheDocument();
  });

  it('skaliert Medaillon und Badge nach Layout: standard = lg, branch = md', () => {
    const { container: standard } = renderNode();
    expect(standard.querySelector('[data-node-medallion]')).toHaveClass('size-medallion');

    const { container: branch } = renderNode({ layout: 'branch' });
    expect(branch.querySelector('[data-node-medallion]')).toHaveClass('size-medallion-sm');
  });

  it('erlaubt md-Medaillons im Standard-Layout über medallionSize', () => {
    const { container } = renderNode({ medallionSize: 'md' });
    expect(container.querySelector('[data-node-medallion]')).toHaveClass('size-medallion-sm');
  });

  it('selektiert per Klick und spiegelt Selektion über aria-pressed', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderNode({ selected: true, onSelect });
    const button = screen.getByRole('button', { pressed: true });
    expect(button).toHaveAttribute('data-selected');
    await user.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
