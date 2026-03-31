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
    container: 'bg-success-subtle border border-success-border',
    title:     'text-success-fg-strong',
    desc:      'text-success-fg',
    close:     'text-success-fg hover:text-success-fg-strong',
  },
  warning: {
    container: 'bg-warning-subtle border border-warning-border',
    title:     'text-warning-fg-strong',
    desc:      'text-warning-fg',
    close:     'text-warning-fg hover:text-warning-fg-strong',
  },
  error: {
    container: 'bg-error-subtle border border-error-border',
    title:     'text-error-fg-strong',
    desc:      'text-error-fg',
    close:     'text-error-fg hover:text-error-fg-strong',
  },
  info: {
    container: 'bg-info-subtle border border-info-border',
    title:     'text-info-fg-strong',
    desc:      'text-info-fg',
    close:     'text-info-fg hover:text-info-fg-strong',
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
