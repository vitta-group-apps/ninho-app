/**
 * NINHO DS — Chip
 * Selecionável — filtros e seleções múltiplas.
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label:      string;
  selected?:  boolean;
  iconLeft?:  React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Chip({
  label,
  selected  = false,
  iconLeft,
  iconRight,
  disabled,
  className,
  ...props
}: ChipProps) {
  return (
    <button
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-[var(--gap-xs)]',
        'px-[var(--padding-md)] py-[var(--padding-xs)]',
        'rounded-pill border font-body text-text-md font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-tint focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'bg-accent-subtle-2 border-accent-tint text-accent-fg'
          : 'bg-pure-white border-neutral-border text-neutral-fg-strong hover:bg-neutral-subtle hover:border-neutral-border-hover',
        className,
      )}
      {...props}
    >
      {iconLeft  && <span className="shrink-0">{iconLeft}</span>}
      <span>{label}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
