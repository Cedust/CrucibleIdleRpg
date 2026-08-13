import { Coins, Flame, ScrollText, Stone, type LucideIcon } from 'lucide-react';
import { useSaveStore } from '@/features/save/saveStore';
import { Tooltip } from '@/shared/ui/Tooltip';
import { formatNumber } from '@/shared/utils/formatNumber';

const RESOURCE_TONE_CLASS = {
  accent: 'text-accent',
  info: 'text-info',
  muted: 'text-text-muted',
} as const;

type ResourceTone = keyof typeof RESOURCE_TONE_CLASS;

/** Floating display of persisted and planned resource balances. */
export function ResourceDock() {
  const currencies = useSaveStore((state) => state.data?.currencies ?? null);

  return (
    <dl
      aria-label="Resources"
      className="absolute right-10 top-10 z-10 flex flex-wrap justify-end gap-2"
    >
      <ResourceChip icon={Coins} label="Gold" value={currencies?.gold} />
      <ResourceChip icon={Stone} label="Relic Shards" value={currencies?.relicShards} tone="info" />
      <ResourceChip icon={Flame} label="Cinder" value={undefined} />
      <ResourceChip icon={ScrollText} label="Runedust" value={undefined} tone="muted" />
    </dl>
  );
}

function ResourceChip({
  icon: ChipIcon,
  label,
  value,
  tone = 'accent',
}: {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  tone?: ResourceTone;
}) {
  const displayValue = value === undefined ? '—' : formatNumber(value);

  return (
    <div className="rounded-full border border-ornament/60 bg-surface/70 px-3 py-1.5 text-sm shadow-panel backdrop-blur-sm">
      <dt className="sr-only">{label}</dt>
      <dd aria-label={`${label} amount`}>
        <Tooltip content={label}>
          {(trigger) => (
            <span
              {...trigger}
              className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <ChipIcon aria-hidden="true" className={`size-4 ${RESOURCE_TONE_CLASS[tone]}`} />
              <span className="font-semibold text-text">{displayValue}</span>
            </span>
          )}
        </Tooltip>
      </dd>
    </div>
  );
}
