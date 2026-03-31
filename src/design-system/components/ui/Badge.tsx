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
  accent:    'bg-accent-subtle    text-accent-fg    border border-accent-border',
  secondary: 'bg-secondary-subtle text-secondary-fg border border-secondary-border',
  success:   'bg-success-subtle   text-success-fg   border border-success-border',
  warning:   'bg-warning-subtle   text-warning-fg   border border-warning-border',
  error:     'bg-error-subtle     text-error-fg     border border-error-border',
  info:      'bg-info-subtle      text-info-fg      border border-info-border',
  neutral:   'bg-neutral-subtle   text-neutral-fg   border border-neutral-border',
};

const dotClasses: Record<BadgeVariant, string> = {
  accent:    'bg-accent-tint',
  secondary: 'bg-secondary-tint',
  success:   'bg-success-tint',
  warning:   'bg-warning-tint',
  error:     'bg-error-tint',
  info:      'bg-info-tint',
  neutral:   'bg-neutral-tint',
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
      'inline-flex items-center justify-center rounded-pill font-body font-semibold leading-none',
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
