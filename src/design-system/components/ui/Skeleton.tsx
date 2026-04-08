/**
 * NINHO DESIGN SYSTEM — Skeleton (Atom + Compostos)
 * Nitro™ Core v3.0
 *
 * MISSÃO: Silhuetas animadas para estados de carregamento.
 * Substitui "Loading..." por placeholders visuais que espelham
 * a estrutura do conteúdo real — melhora perceived performance.
 *
 * Átomos exportados:
 *   - Skeleton          → bloco genérico com shimmer
 *   - SkeletonText      → linha(s) de texto
 *   - SkeletonAvatar    → círculo (avatar)
 *
 * Compostos exportados:
 *   - SkeletonTimelineItem  → silhueta de um item da DailyTimeline
 *   - SkeletonTimeline      → 3 × SkeletonTimelineItem
 *   - SkeletonChart         → silhueta do GrowthChart
 *   - SkeletonCard          → silhueta de um LogCard
 *
 * EXEMPLO:
 * ```tsx
 * if (loading) return <SkeletonTimeline />;
 * ```
 */

import React from 'react';
import { cn } from '../../lib/utils';

// ─── keyframe injectada via Tailwind arbitrary ─────────────────────────────
// O shimmer usa animate-pulse (Tailwind built-in) para leveza.
// Para efeito mais rico seria animate-[shimmer_1.4s_ease-in-out_infinite]
// mas pulse é suficiente sem CSS extra.

// ─── Skeleton atom ────────────────────────────────────────────────────────────

export interface SkeletonProps {
  className?: string;
  /** Override de width (Tailwind class) */
  w?:         string;
  /** Override de height (Tailwind class) */
  h?:         string;
  /** Raio das bordas — default rounded-ds-xs */
  rounded?:   string;
}

export function Skeleton({ className, w = 'w-full', h = 'h-4', rounded = 'rounded-[var(--radius-xs)]' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-ds-neutral-subtle',
        w, h, rounded,
        className,
      )}
    />
  );
}

// ─── SkeletonText ─────────────────────────────────────────────────────────────

export function SkeletonText({ lines = 1, lastWidth = '60%' }: { lines?: number; lastWidth?: string }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 w-full">
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1 && lines > 1;
        return (
          <div
            key={i}
            aria-hidden="true"
            className="animate-pulse bg-ds-neutral-subtle h-3 rounded-[var(--radius-xs)]"
            style={{ width: isLast ? lastWidth : '100%' }}
          />
        );
      })}
    </div>
  );
}

// ─── SkeletonAvatar ───────────────────────────────────────────────────────────

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }[size];
  return <Skeleton w={dim} h={dim} rounded="rounded-full" aria-hidden="true" />;
}

// ─── SkeletonTimelineItem ─────────────────────────────────────────────────────

export function SkeletonTimelineItem({ isLast = false }: { isLast?: boolean }) {
  return (
    <div aria-hidden="true" className="flex gap-[var(--gap-md)]">
      {/* rail */}
      <div className="flex flex-col items-center shrink-0">
        <Skeleton w="w-9" h="h-9" rounded="rounded-full" />
        {!isLast && <div className="w-px flex-1 min-h-[24px] bg-ds-neutral-subtle mt-1 animate-pulse" />}
      </div>

      {/* content */}
      <div className={cn('flex-1 min-w-0 flex flex-col gap-2', isLast ? 'pb-0' : 'pb-5')}>
        <div className="flex items-center gap-2">
          <Skeleton w="w-20" h="h-4" />
          <Skeleton w="w-12" h="h-4" rounded="rounded-ds-pill" />
        </div>
        <Skeleton w="w-32" h="h-3" />
      </div>
    </div>
  );
}

// ─── SkeletonTimeline ─────────────────────────────────────────────────────────

export function SkeletonTimeline({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="A carregar registos…" className="flex flex-col gap-[var(--gap-sm)]">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTimelineItem key={i} isLast={i === rows - 1} />
      ))}
    </div>
  );
}

// ─── SkeletonChart ────────────────────────────────────────────────────────────

export function SkeletonChart() {
  return (
    <div aria-busy="true" aria-label="A carregar gráfico…" className="flex flex-col gap-[var(--gap-md)]">
      {/* metric tabs */}
      <div className="flex gap-2">
        <Skeleton w="w-16" h="h-8" rounded="rounded-ds-pill" />
        <Skeleton w="w-24" h="h-8" rounded="rounded-ds-pill" />
        <Skeleton w="w-20" h="h-8" rounded="rounded-ds-pill" />
      </div>

      {/* chart area */}
      <div className="relative h-44 rounded-[var(--radius-lg)] overflow-hidden bg-ds-neutral-subtle animate-pulse">
        {/* fake area curve shape */}
        <svg viewBox="0 0 300 120" className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          <path
            d="M0 80 C40 70, 80 40, 120 50 S200 20, 240 30 S280 60, 300 50 L300 120 L0 120 Z"
            fill="currentColor"
            className="text-ds-neutral-tint"
          />
        </svg>
      </div>

      {/* x-axis labels */}
      <div className="flex justify-between px-2">
        {[40, 60, 48, 56, 44].map((w, i) => (
          <Skeleton key={i} w={`w-${w > 50 ? '12' : '10'}`} h="h-3" />
        ))}
      </div>
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[var(--radius-lg)] bg-ds-pure-white border border-ds-neutral-border p-[var(--padding-md)] flex flex-col gap-[var(--gap-md)]"
    >
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton w="w-7" h="h-7" rounded="rounded-full" />
          <Skeleton w="w-20" h="h-5" />
        </div>
        <Skeleton w="w-14" h="h-5" rounded="rounded-ds-pill" />
      </div>
      {/* pill rows */}
      <div className="flex gap-2">
        <Skeleton w="w-16" h="h-8" rounded="rounded-ds-pill" />
        <Skeleton w="w-20" h="h-8" rounded="rounded-ds-pill" />
        <Skeleton w="w-14" h="h-8" rounded="rounded-ds-pill" />
      </div>
      {/* button */}
      <Skeleton h="h-10" rounded="rounded-ds-sm" />
    </div>
  );
}
