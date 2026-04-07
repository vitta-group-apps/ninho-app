/**
 * NINHO DESIGN SYSTEM — ProgressBar
 * Node Figma: 2722:24701 | Nitro™ Core v3.0
 *
 * Track: h=8px radius=999px bg=#e2e0df
 * Fill:  purple=#c59ad0 | success | error | warning
 * Layout: horizontal | vertical | none
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type ProgressBarColor  = 'purple' | 'success' | 'error' | 'warning';
export type ProgressBarLayout = 'horizontal' | 'vertical' | 'none';

export interface ProgressBarProps {
  value:           number;
  layout?:         ProgressBarLayout;
  color?:          ProgressBarColor;
  label?:          string;
  optional?:       boolean;
  showIndicator?:  boolean;
  hint?:           string;
  loading?:        boolean;
  className?:      string;
}

const FILL: Record<ProgressBarColor, string> = {
  purple:  'bg-[#c59ad0]',
  success: 'bg-[var(--color-success-background-bg-tint-01,#378163)]',
  error:   'bg-[var(--color-error-background-bg-tint-01,#671d14)]',
  warning: 'bg-[var(--color-warning-background-bg-tint-01,#c7910a)]',
};

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-spin shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="#e2e0df" strokeWidth="2"/>
      <path d="M10 2a8 8 0 0 1 8 8" stroke="#c59ad0" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function Track({ value, color }: { value: number; color: ProgressBarColor }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}
      className="relative w-full h-[8px] rounded-[999px] bg-[#e2e0df] overflow-hidden">
      <div className={cn('absolute left-0 top-0 h-full rounded-[999px] transition-[width] duration-300', FILL[color])}
        style={{ width: `${v}%` }} />
    </div>
  );
}

function LabelRow({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-[4px] shrink-0 whitespace-nowrap">
      <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[length:var(--font-sizes\/text\/md,14px)] leading-[1.5] text-[color:var(--neutral\/foreground\/fg-high-contrast,#3a3836)]">{label}</span>
      {optional && <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[length:var(--font-sizes\/text\/md,14px)] leading-[1.5] text-[color:var(--neutral\/foreground\/fg-low-contrast,#524f4c)]">(optional)</span>}
    </div>
  );
}

function Indicator({ value, loading }: { value: number; loading: boolean }) {
  return (
    <div className="flex items-center gap-[8px] shrink-0">
      <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[length:var(--font-sizes\/text\/sm,12px)] leading-[1.5] whitespace-nowrap text-[color:var(--neutral\/foreground\/fg-high-contrast,#3a3836)]">{Math.round(value)}%</span>
      {loading && <Spinner />}
    </div>
  );
}

export function ProgressBar({ value, layout = 'vertical', color = 'purple', label, optional = false, showIndicator = false, hint, loading = false, className }: ProgressBarProps) {

  if (layout === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-[16px] w-full', className)}>
        {label && <LabelRow label={label} optional={optional} />}
        <div className="flex-1 min-w-0"><Track value={value} color={color} /></div>
        {showIndicator && <Indicator value={value} loading={loading} />}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-[8px] w-full', className)}>
      {layout === 'vertical' && (label || showIndicator) && (
        <div className="flex items-center justify-between gap-[8px]">
          {label && <LabelRow label={label} optional={optional} />}
          {showIndicator && <Indicator value={value} loading={loading} />}
        </div>
      )}
      <Track value={value} color={color} />
      {hint && <p className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[length:var(--font-sizes\/text\/sm,12px)] leading-[1.5] text-[color:var(--neutral\/foreground\/fg-low-contrast,#524f4c)]">{hint}</p>}
    </div>
  );
}
