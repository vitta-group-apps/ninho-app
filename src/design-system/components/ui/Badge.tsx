/**
 * NINHO DS — Badge
 * Indicadores de contagem ou status (dot).
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize    = 'sm' | 'md';

export interface BadgeProps {
  label?:   string | number;
  variant?: BadgeVariant;
  size?:    BadgeSize;
  dot?:     boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent:    'bg-ds-accent-subtle    text-ds-accent-fg    border border-ds-accent-border',
  secondary: 'bg-ds-secondary-subtle text-ds-secondary-fg border border-ds-secondary-border',
  success:   'bg-ds-success-subtle   text-ds-success-fg   border border-ds-success-border',
  warning:   'bg-ds-warning-subtle   text-ds-warning-fg   border border-ds-warning-border',
  error:     'bg-ds-error-subtle     text-ds-error-fg     border border-ds-error-border',
  info:      'bg-ds-info-subtle      text-ds-info-fg      border border-ds-info-border',
  neutral:   'bg-ds-neutral-subtle   text-ds-neutral-fg   border border-ds-neutral-border',
};

const dotClasses: Record<BadgeVariant, string> = {
  accent:    'bg-ds-accent-tint',
  secondary: 'bg-ds-secondary-tint',
  success:   'bg-ds-success-tint',
  warning:   'bg-ds-warning-tint',
  error:     'bg-ds-error-tint',
  info:      'bg-ds-info-tint',
  neutral:   'bg-ds-neutral-tint',
};

export function Badge({
  label,
  variant   = 'accent',
  size      = 'md',
  dot       = false,
  className,
}: BadgeProps) {
  if (dot) {
    return (
      <span className={cn(
        'inline-block rounded-full shrink-0',
        size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
        dotClasses[variant],
        className,
      )} />
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-ds-pill font-body font-semibold leading-none',
      size === 'sm'
        ? 'px-[var(--padding-xs)] py-[2px] text-text-xs min-w-[18px]'
        : 'px-[var(--padding-sm)] py-[3px] text-text-sm min-w-[22px]',
      variantClasses[variant],
      className,
    )}>
      {label}
    </span>
  );
}
