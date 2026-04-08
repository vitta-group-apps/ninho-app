/**
 * NINHO — GrowthChart
 * Gráfico de linha estilo Apple Health: sem grid excessivo, curva suave, tokens DS.
 * Usa Recharts — AreaChart para peso e LineChart para comprimento/perímetro.
 */

import React, { useState } from 'react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Text }  from '@/design-system/components/ui/Text';
import { Card }  from '@/design-system/components/ui/Card';
import { cn }    from '@/design-system/lib/utils';
import { useGrowthLog } from '../hooks/useGrowthLog';
import type { GrowthRow } from '../types/health';

// ─── tokens extraídos das variáveis DS ───────────────────────────────────────
const COLOR_ACCENT  = '#8b5e96';   // ds-accent-tint
const COLOR_SUCCESS = '#4a7c59';   // ds-success-tint
const COLOR_INFO    = '#3b6fa0';   // ds-info-tint
const COLOR_MUTED   = '#a9a5a2';   // ds-neutral-border

// ─── metric tabs ─────────────────────────────────────────────────────────────

type Metric = 'weight' | 'length' | 'head';

const METRIC_CONFIG: Record<Metric, {
  label:  string;
  unit:   string;
  color:  string;
  value:  (r: GrowthRow) => number | null;
}> = {
  weight: {
    label: 'Peso',
    unit:  'kg',
    color: COLOR_ACCENT,
    value: r => r.weight_grams != null ? r.weight_grams / 1000 : null,
  },
  length: {
    label: 'Comprimento',
    unit:  'cm',
    color: COLOR_SUCCESS,
    value: r => r.length_cm,
  },
  head: {
    label: 'P. Cefálico',
    unit:  'cm',
    color: COLOR_INFO,
    value: r => r.head_circumference_cm,
  },
};

// ─── custom tooltip ──────────────────────────────────────────────────────────

function NinhoTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-ds-pure-white border border-ds-neutral-border rounded-[var(--radius-sm)] px-[var(--padding-sm)] py-[var(--padding-xs)] shadow-ds-sm">
      <Text variant="body-md-semibold" as="span">{val} {unit}</Text>
      <Text variant="caption-regular" color="secondary" as="p">{payload[0]?.payload?.label}</Text>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

function buildPoints(rows: GrowthRow[], metric: Metric) {
  return rows
    .filter(r => METRIC_CONFIG[metric].value(r) != null)
    .map(r => ({
      label: fmtDate(r.measured_at),
      value: METRIC_CONFIG[metric].value(r),
    }))
    .reverse(); // chronological
}

// ─── component ───────────────────────────────────────────────────────────────

export interface GrowthChartProps {
  childId: string;
}

export function GrowthChart({ childId }: GrowthChartProps) {
  const { measurements, loading } = useGrowthLog(childId);
  const [metric, setMetric]       = useState<Metric>('weight');

  const cfg    = METRIC_CONFIG[metric];
  const points = buildPoints(measurements, metric);

  return (
    <Card variant="elevated" padding="md">
      {/* header */}
      <div className="flex items-center justify-between mb-[var(--gap-md)]">
        <Text variant="body-lg-semibold">Crescimento</Text>
        {points.length > 0 && (
          <Text variant="caption-regular" color="secondary" as="span">
            {points.length} registos
          </Text>
        )}
      </div>

      {/* metric selector */}
      <div className="flex gap-[var(--gap-xs)] mb-[var(--gap-md)]">
        {(Object.entries(METRIC_CONFIG) as [Metric, typeof cfg][]).map(([key, c]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMetric(key)}
            className={cn(
              'flex-1 py-[var(--padding-xs)] rounded-[var(--radius-sm)]',
              'font-body text-text-xs font-medium transition-colors duration-150',
              metric === key
                ? 'bg-ds-accent-subtle-2 text-ds-accent-fg'
                : 'bg-ds-neutral-subtle text-ds-neutral-fg hover:bg-ds-neutral-bg-hover',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* chart */}
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Text variant="caption-regular" color="secondary">A carregar…</Text>
        </div>
      ) : points.length < 2 ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl" aria-hidden="true">📈</span>
          <Text variant="caption-regular" color="secondary">
            Adiciona pelo menos 2 medições para ver o gráfico.
          </Text>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* subtle single horizontal line only */}
            <CartesianGrid vertical={false} stroke={COLOR_MUTED} strokeOpacity={0.25} strokeDasharray="0" />

            <XAxis
              dataKey="label"
              tick={{ fontFamily: 'Nunito', fontSize: 10, fill: COLOR_MUTED }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontFamily: 'Nunito', fontSize: 10, fill: COLOR_MUTED }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={<NinhoTooltip unit={cfg.unit} />}
              cursor={{ stroke: cfg.color, strokeWidth: 1, strokeOpacity: 0.4 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={cfg.color}
              strokeWidth={2.5}
              fill={`url(#grad-${metric})`}
              dot={{ r: 3, fill: cfg.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: cfg.color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* latest value callout */}
      {points.length > 0 && (
        <div className="mt-[var(--gap-md)] flex items-end gap-[var(--gap-xs)]">
          <Text variant="h2" as="span" className="text-ds-neutral-fg-strong">
            {points[points.length - 1].value}
          </Text>
          <Text variant="body-md-regular" color="secondary" as="span" className="mb-[3px]">
            {cfg.unit}
          </Text>
          <Text variant="caption-regular" color="secondary" as="span" className="mb-[3px] ml-auto">
            {points[points.length - 1].label}
          </Text>
        </div>
      )}
    </Card>
  );
}
