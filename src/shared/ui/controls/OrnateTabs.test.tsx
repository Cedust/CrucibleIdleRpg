// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrnateTab, OrnateTabs } from './OrnateTabs';

function renderTabs() {
  return render(
    <OrnateTabs label="Trees" className="grid-cols-2">
      <OrnateTab
        id="tab-one"
        selected
        controls="panel-one"
        surface={<span data-testid="surface-one" />}
      >
        ONE
      </OrnateTab>
      <OrnateTab id="tab-two" selected={false} controls="panel-two" surface={<span />}>
        TWO
      </OrnateTab>
    </OrnateTabs>,
  );
}

describe('OrnateTabs', () => {
  it('rendert eine horizontale Tab-Leiste mit Token-Höhe im eigenen Scroller', () => {
    const { container } = renderTabs();

    const tablist = screen.getByRole('tablist', { name: 'Trees' });
    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    expect(tablist).toHaveClass('h-tab-strip', 'grid-cols-2');
    expect(container.querySelector('.overflow-x-auto')).toContainElement(tablist);
  });

  it('verdrahtet Selektion über aria-selected und data-selected', () => {
    renderTabs();

    const one = screen.getByRole('tab', { name: 'ONE' });
    const two = screen.getByRole('tab', { name: 'TWO' });
    expect(one).toHaveAttribute('aria-selected', 'true');
    expect(one).toHaveAttribute('data-selected');
    expect(one).toHaveAttribute('aria-controls', 'panel-one');
    expect(two).toHaveAttribute('aria-selected', 'false');
    expect(two).not.toHaveAttribute('data-selected');
  });

  it('rendert Surface-Slot und Ornamentrahmen je Tab', () => {
    renderTabs();

    const one = screen.getByRole('tab', { name: 'ONE' });
    expect(one).toContainElement(screen.getByTestId('surface-one'));
    expect(one.querySelector('[data-ornate-tab-frame]')).toHaveClass('border-image-tab-ornate');
  });
});
