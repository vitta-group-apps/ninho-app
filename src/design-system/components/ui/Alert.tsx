/**
 * NINHO DS — Alert
 * Feedback contextual: success | warning | error | info
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
  variant:     AlertVariant;
  title?:      string;
  description: string;
  icon?:       React.ReactNode;
  onClose?:    () => void;
  className?:  string;
}

const variantClasses: Record<AlertVariant, {
  container: string;
  title:     string;
  desc:      string;
  close:     string;
}> = {
  success: {
    container: 'bg-ds-success-subtle border border-ds-success-border',
    title:     'text-ds-success-fg-strong',
    desc:      'text-ds-success-fg',
    close:     'text-ds-success-fg hover:text-ds-success-fg-strong',
  },
  warning: {
    container: 'bg-ds-warning-subtle border border-ds-warning-border',
    title:     'text-ds-warning-fg-strong',
    desc:      'text-ds-warning-fg',
    close:     'text-ds-warning-fg hover:text-ds-warning-fg-strong',
  },
  error: {
    container: 'bg-ds-error-subtle border border-ds-error-border',
    title:     'text-ds-error-fg-strong',
    desc:      'text-ds-error-fg',
    close:     'text-ds-error-fg hover:text-ds-error-fg-strong',
  },
  info: {
    container: 'bg-ds-info-subtle border border-ds-info-border',
    title:     'text-ds-info-fg-strong',
    desc:      'text-ds-info-fg',
    close:     'text-ds-info-fg hover:text-ds-info-fg-strong',
  },
};

export function Alert({
  variant,
  title,
  description,
  icon,
  onClose,
  className,
}: AlertProps) {
  const v = variantClasses[variant];

  return (
    <div role="alert" className={cn(
      'flex gap-[var(--gap-sm)] p-[var(--padding-md)]',
      'rounded-[var(--radius-sm)]',
      v.container,
      className,
    )}>
      {/* Icon */}
      {icon && (
        <span className={cn('shrink-0 mt-0.5', v.title)}>{icon}</span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-body font-semibold text-text-md mb-0.5', v.title)}>
            {title}
          </p>
        )}
        <p className={cn('font-body font-regular text-text-md', v.desc)}>
          {description}
        </p>
      </div>

      {/* Close */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Fechar"
          className={cn(
            'shrink-0 h-5 w-5 flex items-center justify-center',
            'rounded-[var(--radius-xxs)] transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
            v.close,
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
