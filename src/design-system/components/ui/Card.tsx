/**
 * NINHO DS — Card
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children:   React.ReactNode;
  variant?:   CardVariant;
  padding?:   CardPadding;
  onClick?:   () => void;
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  elevated: 'bg-ds-pure-white shadow-ds-xs',
  outlined: 'bg-ds-pure-white border border-ds-neutral-border',
  filled:   'bg-ds-neutral-subtle',
  ghost:    'bg-transparent',
};

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm:   'p-[var(--padding-sm)]',
  md:   'p-[var(--padding-md)]',
  lg:   'p-[var(--padding-lg)]',
};

export function Card({
  children,
  variant  = 'elevated',
  padding  = 'md',
  onClick,
  className,
}: CardProps) {
  const base = cn(
    'rounded-[var(--radius-xl)] overflow-hidden',
    variantClasses[variant],
    paddingClasses[padding],
    onClick && 'cursor-pointer transition-shadow hover:shadow-ds-sm active:shadow-ds-xs',
    className,
  );

  if (onClick) {
    return (
      <div role="button" tabIndex={0} onClick={onClick}
        onKeyDown={e => e.key === 'Enter' && onClick()}
        className={base}>
        {children}
      </div>
    );
  }

  return <div className={base}>{children}</div>;
}
