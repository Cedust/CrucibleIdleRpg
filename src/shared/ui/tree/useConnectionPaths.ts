import { useLayoutEffect, useState, type RefObject } from 'react';

/** Kante zwischen zwei Medaillons; `unlocked` steuert nur das Styling. */
export interface NodeConnection {
  sourceId: string;
  targetId: string;
  unlocked: boolean;
}

export function connectionKey(connection: NodeConnection): string {
  return `${connection.sourceId}->${connection.targetId}`;
}

interface NodeAnchor {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

function rounded(value: number): number {
  return Math.round(value * 10) / 10;
}

function anchorFor(rect: DOMRect, containerRect: DOMRect): NodeAnchor {
  const left = rect.left - containerRect.left;
  const top = rect.top - containerRect.top;

  return {
    left,
    right: left + rect.width,
    top,
    bottom: top + rect.height,
    centerX: left + rect.width / 2,
    centerY: top + rect.height / 2,
  };
}

/** Orthogonaler Pfad entlang der dominanten Achse (H-V-H bzw. V-H-V). */
function connectorPath(source: NodeAnchor, target: NodeAnchor): string {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    const movesRight = deltaX >= 0;
    const sourceX = movesRight ? source.right : source.left;
    const targetX = movesRight ? target.left : target.right;
    const middleX = (sourceX + targetX) / 2;

    return `M ${rounded(sourceX)} ${rounded(source.centerY)} H ${rounded(middleX)} V ${rounded(
      target.centerY,
    )} H ${rounded(targetX)}`;
  }

  const movesDown = deltaY >= 0;
  const sourceY = movesDown ? source.bottom : source.top;
  const targetY = movesDown ? target.top : target.bottom;
  const middleY = (sourceY + targetY) / 2;

  return `M ${rounded(source.centerX)} ${rounded(sourceY)} V ${rounded(middleY)} H ${rounded(
    target.centerX,
  )} V ${rounded(targetY)}`;
}

/**
 * Misst die `[data-node-medallion]`-Anker unterhalb des Containers und leitet
 * je Verbindung einen orthogonalen SVG-Pfad ab. Beobachtet Container und
 * Medaillons per ResizeObserver (Fallback: window-resize) und setzt nur bei
 * tatsächlicher Pfadänderung neuen State.
 */
export function useConnectionPaths(
  containerRef: RefObject<HTMLElement | null>,
  connections: readonly NodeConnection[],
): ReadonlyMap<string, string> {
  const [paths, setPaths] = useState<ReadonlyMap<string, string>>(() => new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const medallions = Array.from(container.querySelectorAll<HTMLElement>('[data-node-medallion]'));

    const updatePaths = () => {
      const containerRect = container.getBoundingClientRect();
      const anchors = new Map(
        medallions.flatMap((medallion) => {
          const nodeId = medallion.dataset.nodeMedallion;
          return nodeId === undefined
            ? []
            : [[nodeId, anchorFor(medallion.getBoundingClientRect(), containerRect)] as const];
        }),
      );
      const nextPaths = new Map<string, string>();

      for (const connection of connections) {
        const source = anchors.get(connection.sourceId);
        const target = anchors.get(connection.targetId);
        if (source !== undefined && target !== undefined) {
          nextPaths.set(connectionKey(connection), connectorPath(source, target));
        }
      }

      setPaths((current) => {
        const isUnchanged =
          current.size === nextPaths.size &&
          Array.from(nextPaths).every(([key, path]) => current.get(key) === path);
        return isUnchanged ? current : nextPaths;
      });
    };

    updatePaths();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updatePaths);
      return () => window.removeEventListener('resize', updatePaths);
    }

    const observer = new ResizeObserver(updatePaths);
    observer.observe(container);
    medallions.forEach((medallion) => observer.observe(medallion));
    return () => observer.disconnect();
  }, [connections, containerRef]);

  return paths;
}
