/**
 * NINHO DS — Input
 * Estados: default | focus | filled | error | disabled
 */

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:          string;
  hint?:           string;
  error?:          string;
  iconLeft?:       React.ReactNode;
  iconRight?:      React.ReactNode;
  containerClass?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  containerClass,
  className,
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-[var(--gap-xs)]', containerClass)}>

      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'font-body text-text-md font-medium',
            disabled ? 'text-ds-neutral-fg' : 'text-ds-neutral-fg-strong',
          )}
        >
          {label}
        </label>
      )}

      {/* Field */}
      <div className={cn(
        'flex items-center gap-[var(--gap-xs)]',
        'px-[var(--padding-md)] h-12',
        'rounded-[var(--radius-sm)] border bg-ds-pure-white',
        'transition-colors duration-150',
        // Estados
        hasError
          ? 'border-ds-error-border'
          : 'border-ds-neutral-border hover:border-ds-neutral-border-hover focus-within:border-accent-tint focus-within:ring-1 focus-within:ring-ds-accent-tint',
        disabled && 'bg-ds-neutral-bg-enabled border-ds-neutral-border cursor-not-allowed',
      )}>
        {iconLeft && (
          <span className="shrink-0 text-ds-neutral-fg">{iconLeft}</span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent outline-none',
            'font-body text-text-lg font-regular',
            'text-ds-neutral-fg-strong placeholder:text-ds-neutral-fg',
            'disabled:cursor-not-allowed disabled:text-ds-neutral-fg',
            className,
          )}
          {...props}
        />

        {iconRight && (
          <span className="shrink-0 text-ds-neutral-fg">{iconRight}</span>
        )}
      </div>

      {/* Hint / Error */}
      {(hint || error) && (
        <p className={cn(
          'font-body text-text-sm',
          hasError ? 'text-ds-error-fg' : 'text-ds-neutral-fg',
        )}>
          {error ?? hint}
        </p>
      )}

    </div>
  );
});

Input.displayName = 'Input';
