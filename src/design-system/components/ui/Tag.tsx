/**
 * NINHO DS — Tag
 * Label informativo de status. Não é interativo.
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type TagVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface TagProps {
  label:    string;
  variant?: TagVariant;
  icon?:    React.ReactNode;
  className?: string;
}

const variantClasses: Record<TagVariant, string> = {
  accent:    'bg-accent-subtle    text-accent-fg-strong',
  secondary: 'bg-secondary-subtle text-secondary-fg-strong',
  success:   'bg-success-subtle   text-success-fg-strong',
  warning:   'bg-warning-subtle   text-warning-fg-strong',
  error:     'bg-error-subtle     text-error-fg-strong',
  info:      'bg-info-subtle      text-info-fg-strong',
  neutral:   'bg-neutral-subtle   text-neutral-fg-strong',
};

export function Tag({ label, variant = 'neutral', icon, className }: TagProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1',
      'px-[var(--padding-xs)] py-[2px]',
      'rounded-[var(--radius-xxs)]',
      'font-body text-text-xs font-semibold',
      variantClasses[variant],
      className,
    )}>
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </span>
  );
}
