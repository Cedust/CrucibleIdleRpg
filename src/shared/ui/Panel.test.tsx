// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from './Panel';

describe('Panel', () => {
  it('rendert Kinder und reicht ARIA-Attribute an das gewählte Element durch', () => {
    render(
      <Panel as="section" aria-labelledby="panel-heading">
        <h2 id="panel-heading">Act I</h2>
        <p>Content</p>
      </Panel>,
    );

    const section = screen.getByRole('region', { name: 'Act I' });
    expect(section.tagName).toBe('SECTION');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('unterstützt große, kompakte, dünne und ruhige Rahmenvarianten', () => {
    const { container, rerender } = render(<Panel>Ornate</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.tagName).toBe('DIV');
    expect(panel).toHaveClass('border-image-ornate', 'p-4');

    rerender(
      <Panel variant="thin" padding="none">
        Thin
      </Panel>,
    );
    expect(panel).toHaveClass('bg-surface/70');
    expect(panel).not.toHaveClass('border-image-ornate', 'bg-surface/90', 'p-4');
    expect(panel.querySelector('.border-image-thin')).toBeInTheDocument();

    rerender(
      <Panel variant="ornateCompact" padding="none">
        Compact ornate
      </Panel>,
    );
    expect(panel).toHaveClass('bg-surface/70');
    expect(panel).not.toHaveClass('border-image-ornate', 'p-4');
    expect(panel.querySelector('.border-image-tab-ornate')).toBeInTheDocument();
    expect(panel.querySelector('.border-image-thin')).not.toBeInTheDocument();

    rerender(
      <Panel variant="plain" padding="none">
        Plain
      </Panel>,
    );
    expect(panel).toHaveClass('border-border');
    expect(panel).not.toHaveClass('border-image-ornate', 'p-4');
    expect(panel.querySelector('.border-image-thin')).not.toBeInTheDocument();
  });
});
