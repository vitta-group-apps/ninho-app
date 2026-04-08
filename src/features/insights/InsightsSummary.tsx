/**
 * NINHO — InsightsSummary
 * Resumo diário de métricas em cards compactos — estilo Apple Health summary.
 */

import React from 'react';
import { Card } from '@/design-system/components/ui/Card';
import { Text } from '@/design-system/components/ui/Text';
import { useInsights } from './useInsights';
import { cn } from '@/design-system/lib/utils';

function MetricTile({
  emoji, label, value, sub, color,
}: {
  emoji:  string;
  label:  string;
  value:  string;
  sub?:   string;
  color?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col gap-[var(--gap-xxs)]',
      'bg-ds-pure-white rounded-[var(--radius-lg)] p-[var(--padding-sm)]',
      'border border-ds-neutral-border',
    )}>
      <span className="text-xl" aria-hidden="true">{emoji}</span>
      <Text variant="caption-medium" color="secondary" as="span">{label}</Text>
      <Text variant="body-lg-semibold" as="span" className={color}>{value}</Text>
      {sub && <Text variant="caption-regular" color="secondary" as="span">{sub}</Text>}
    </div>
  );
}

function fmtSleep(min: number) {
  if (min === 0) return '–';
  if (min < 60)  return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60 > 0 ? `${min % 60}m` : ''}`.trim();
}

export interface InsightsSummaryProps {
  childId: string;
}

export function InsightsSummary({ childId }: InsightsSummaryProps) {
  const { insights, loading } = useInsights(childId);

  if (loading) return null; // não bloqueia o render da página

  return (
    <div className="grid grid-cols-2 gap-[var(--gap-sm)]">
      <MetricTile
        emoji="🌙"
        label="Sono hoje"
        value={fmtSleep(insights.totalSleepMin)}
        sub={insights.lastSleepAgo || undefined}
      />
      <MetricTile
        emoji="🍼"
        label="Alimentações"
        value={String(insights.feedingCount || '–')}
        sub={insights.avgFeedDuration > 0 ? `~${insights.avgFeedDuration} min/vez` : undefined}
      />
      <MetricTile
        emoji="🧷"
        label="Fraldas"
        value={String(insights.diaperCount || '–')}
        sub={insights.diaperDirty > 0 ? `${insights.diaperDirty} com cocô` : undefined}
      />
      <MetricTile
        emoji="✨"
        label="Bem-estar"
        value={insights.feedingCount >= 6 ? 'Ótimo' : insights.feedingCount >= 3 ? 'Normal' : '–'}
        color={insights.feedingCount >= 6 ? 'text-ds-success-fg-strong' : undefined}
      />
    </div>
  );
}
