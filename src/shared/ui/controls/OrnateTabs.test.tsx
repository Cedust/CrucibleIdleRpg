// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrnateTab, OrnateTabs } from './OrnateTabs';

function renderTabs() {
  return render(
    <OrnateTabs label="Trees" className="grid-cols-2">
      <OrnateTab id="tab-one" selected controls="panel-one">
        ONE
      </OrnateTab>
      <OrnateTab id="tab-two" selected={false} controls="panel-two">
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
    expect(tablist).toHaveClass('ornate-tab-bar', 'ornate-corners', 'h-tab-strip', 'grid-cols-2');
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

  it('legt die Selektionsfläche hinter den Inhalt jedes Tabs', () => {
    renderTabs();

    for (const name of ['ONE', 'TWO']) {
      const tab = screen.getByRole('tab', { name });
      expect(tab.querySelector('[data-ornate-tab-selection]')).toHaveClass(
        'ornate-tab-selection',
        'ornate-corners',
        '-z-10',
      );
    }
  });
});
