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
  accent:    'bg-ds-accent-subtle    text-ds-accent-fg-strong',
  secondary: 'bg-ds-secondary-subtle text-ds-secondary-fg-strong',
  success:   'bg-ds-success-subtle   text-ds-success-fg-strong',
  warning:   'bg-ds-warning-subtle   text-ds-warning-fg-strong',
  error:     'bg-ds-error-subtle     text-ds-error-fg-strong',
  info:      'bg-ds-info-subtle      text-ds-info-fg-strong',
  neutral:   'bg-ds-neutral-subtle   text-ds-neutral-fg-strong',
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
