// @vitest-environment jsdom
import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ConnectionLayer } from './ConnectionLayer';
import { connectionKey, useConnectionPaths, type NodeConnection } from './useConnectionPaths';

function mockRect(element: HTMLElement, rect: { x: number; y: number; w: number; h: number }) {
  element.getBoundingClientRect = () => ({
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.w,
    bottom: rect.y + rect.h,
    width: rect.w,
    height: rect.h,
    x: rect.x,
    y: rect.y,
    toJSON: () => ({}),
  });
}

function Harness({
  connections,
  onPaths,
}: {
  connections: readonly NodeConnection[];
  onPaths: (paths: ReadonlyMap<string, string>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const paths = useConnectionPaths(ref, connections);
  onPaths(paths);

  return (
    <div ref={ref}>
      <span data-node-medallion="a" data-testid="node-a" />
      <span data-node-medallion="b" data-testid="node-b" />
      <ConnectionLayer connections={connections} paths={paths} />
    </div>
  );
}

const CONNECTION: NodeConnection = { sourceId: 'a', targetId: 'b', unlocked: true };

describe('connectionKey', () => {
  it('bildet den Kanten-Schlüssel aus Quelle und Ziel', () => {
    expect(connectionKey(CONNECTION)).toBe('a->b');
  });
});

describe('useConnectionPaths', () => {
  it('routet horizontal dominante Kanten H-V-H von Kante zu Kante', () => {
    let latest: ReadonlyMap<string, string> = new Map();
    const { container } = render(
      <Harness connections={[CONNECTION]} onPaths={(paths) => (latest = paths)} />,
    );

    mockRect(container.firstElementChild as HTMLElement, { x: 0, y: 0, w: 400, h: 200 });
    mockRect(container.querySelector('[data-node-medallion="a"]') as HTMLElement, {
      x: 0,
      y: 40,
      w: 40,
      h: 40,
    });
    mockRect(container.querySelector('[data-node-medallion="b"]') as HTMLElement, {
      x: 200,
      y: 100,
      w: 40,
      h: 40,
    });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(latest.get('a->b')).toBe('M 40 60 H 120 V 120 H 200');
  });

  it('routet vertikal dominante Kanten V-H-V', () => {
    let latest: ReadonlyMap<string, string> = new Map();
    const { container } = render(
      <Harness connections={[CONNECTION]} onPaths={(paths) => (latest = paths)} />,
    );

    mockRect(container.firstElementChild as HTMLElement, { x: 0, y: 0, w: 200, h: 400 });
    mockRect(container.querySelector('[data-node-medallion="a"]') as HTMLElement, {
      x: 40,
      y: 0,
      w: 40,
      h: 40,
    });
    mockRect(container.querySelector('[data-node-medallion="b"]') as HTMLElement, {
      x: 60,
      y: 200,
      w: 40,
      h: 40,
    });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(latest.get('a->b')).toBe('M 60 40 V 120 H 80 V 200');
  });

  it('behält die Map-Referenz, wenn sich kein Pfad ändert', () => {
    let latest: ReadonlyMap<string, string> = new Map();
    const { container } = render(
      <Harness connections={[CONNECTION]} onPaths={(paths) => (latest = paths)} />,
    );

    mockRect(container.firstElementChild as HTMLElement, { x: 0, y: 0, w: 400, h: 200 });
    mockRect(container.querySelector('[data-node-medallion="a"]') as HTMLElement, {
      x: 0,
      y: 40,
      w: 40,
      h: 40,
    });
    mockRect(container.querySelector('[data-node-medallion="b"]') as HTMLElement, {
      x: 200,
      y: 100,
      w: 40,
      h: 40,
    });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const first = latest;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(latest).toBe(first);
  });
});

describe('ConnectionLayer', () => {
  it('rendert je Kante einen zustandsgetragenen Pfad', () => {
    const locked: NodeConnection = { sourceId: 'a', targetId: 'b', unlocked: false };
    const paths = new Map([['a->b', 'M 0 0 H 10']]);
    const { container } = render(<ConnectionLayer connections={[locked]} paths={paths} />);

    const path = container.querySelector('[data-connection="a->b"]');
    expect(path).toHaveAttribute('data-state', 'locked');
    expect(path).toHaveAttribute('stroke-dasharray', '3 5');
    expect(path).toHaveAttribute('d', 'M 0 0 H 10');
    expect(path).toHaveClass('text-border');
  });
});
