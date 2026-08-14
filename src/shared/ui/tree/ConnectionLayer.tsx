import { connectionKey, type NodeConnection } from './useConnectionPaths';

interface ConnectionLayerProps {
  connections: readonly NodeConnection[];
  paths: ReadonlyMap<string, string>;
}

/**
 * SVG-Ebene der Medaillon-Verbindungen unterhalb der Nodes (z-0); der
 * umgebende Container liefert die Pfade über `useConnectionPaths`.
 */
export function ConnectionLayer({ connections, paths }: ConnectionLayerProps) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full">
      {connections.map((connection) => {
        const key = connectionKey(connection);
        return (
          <path
            key={key}
            d={paths.get(key) ?? ''}
            data-connection={key}
            data-state={connection.unlocked ? 'unlocked' : 'locked'}
            fill="none"
            stroke="currentColor"
            strokeWidth={connection.unlocked ? 2 : 1.5}
            strokeDasharray={connection.unlocked ? undefined : '3 5'}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={connection.unlocked ? 'text-accent' : 'text-border'}
          />
        );
      })}
    </svg>
  );
}
