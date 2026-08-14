// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeMedallion, RankPips } from './NodeMedallion';

describe('NodeMedallion', () => {
  it('rendert den Mess-Hook und die Token-Größe lg per Default', () => {
    const { container } = render(
      <NodeMedallion nodeId="anvil.waystones">
        <span>Icon</span>
      </NodeMedallion>,
    );

    const medallion = container.querySelector('[data-node-medallion="anvil.waystones"]');
    expect(medallion).not.toBeNull();
    expect(medallion).toHaveClass('size-medallion');
  });

  it('nutzt für md die kleine Medaillon-Größe', () => {
    const { container } = render(
      <NodeMedallion size="md" nodeId="warhammer.chc-1">
        <span>Icon</span>
      </NodeMedallion>,
    );

    expect(container.querySelector('[data-node-medallion]')).toHaveClass('size-medallion-sm');
  });

  it('färbt investierte Medaillons mit Glut', () => {
    const { container } = render(
      <NodeMedallion nodeId="a" invested>
        <span>Icon</span>
      </NodeMedallion>,
    );

    expect(container.querySelector('[data-node-medallion]')).toHaveClass('bg-ember/15');
  });

  it('rendert Kinder innerhalb des Medaillons', () => {
    const { getByText } = render(
      <NodeMedallion nodeId="a">
        <span>Icon</span>
      </NodeMedallion>,
    );

    expect(getByText('Icon')).toBeInTheDocument();
  });
});

describe('RankPips', () => {
  it('rendert maxRank Pips und hebt investierte Ränge hervor', () => {
    const { container } = render(<RankPips rank={2} maxRank={5} />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    const pips = wrapper?.children ?? [];
    expect(pips).toHaveLength(5);
    expect(pips[0]).toHaveClass('shadow-glow-accent-sm');
    expect(pips[1]).toHaveClass('shadow-glow-accent-sm');
    expect(pips[2]).not.toHaveClass('shadow-glow-accent-sm');
    expect(pips[2]).toHaveClass('border-border', 'bg-background');
  });
});
