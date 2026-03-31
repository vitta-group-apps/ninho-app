/**
 * NINHO DS — Button
 * Fiel ao Figma: node 2115:3905
 *
 * Variantes:  primary | secondary | tertiary | danger
 * Tamanhos:   lg (56) | md (48) | sm (40) | xs (28)
 * Estados:    default | hover | focus | loading | disabled
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize    = 'lg' | 'md' | 'sm' | 'xs';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label:       string;
  variant?:    ButtonVariant;
  size?:       ButtonSize;
  loading?:    boolean;
  iconLeft?:   React.ReactNode;
  iconRight?:  React.ReactNode;
  fullWidth?:  boolean;
}

// ─── Tokens do Figma mapeados para classes Tailwind ──────────
// Primary:   bg=accent-tint  texto=on-tint-white  border=transparent
// Secondary: bg=neutral-subtle borda=neutral-border texto=neutral-fg-strong
// Tertiary:  bg=transparent   borda=neutral-border  texto=neutral-fg-strong
// Danger:    bg=error-tint    texto=on-tint-white   border=transparent

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent-tint text-on-tint-white border-transparent',
    'hover:bg-accent-tint-dark',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-tint focus-visible:ring-offset-2',
    'disabled:bg-[var(--color-accent-disabled-bg-disabled)] disabled:text-[var(--color-accent-disabled-fg-disabled)]',
  ].join(' '),

  secondary: [
    'bg-neutral-subtle text-neutral-fg-strong border border-neutral-border',
    'hover:bg-neutral-bg-hover hover:border-neutral-border-hover',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-border focus-visible:ring-offset-2',
    'disabled:bg-[var(--color-neutral-disabled-bg-disabled)] disabled:text-[var(--color-neutral-disabled-fg-disabled)] disabled:border-transparent',
  ].join(' '),

  tertiary: [
    'bg-transparent text-neutral-fg-strong border border-neutral-border',
    'hover:bg-neutral-subtle hover:border-neutral-border-hover',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-border focus-visible:ring-offset-2',
    'disabled:text-[var(--color-neutral-disabled-fg-disabled)] disabled:border-[var(--color-neutral-disabled-bg-disabled)]',
  ].join(' '),

  danger: [
    'bg-error-tint text-on-tint-white border-transparent',
    'hover:bg-error-tint-dark',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-tint focus-visible:ring-offset-2',
    'disabled:bg-[var(--color-error-disabled-bg-disabled)] disabled:text-[var(--color-error-disabled-fg-disabled)]',
  ].join(' '),
};

// Tamanhos — exatamente como no Figma (h=56/48/40/28, px=padding-xl, py=padding-lg)
const sizeClasses: Record<ButtonSize, string> = {
  lg: 'h-14 px-[var(--padding-xl)] py-[var(--padding-lg)] text-text-lg rounded-[var(--radius-xs)] gap-[var(--gap-xs)]',
  md: 'h-12 px-[var(--padding-xl)] py-[var(--padding-md)] text-text-lg rounded-[var(--radius-xs)] gap-[var(--gap-xs)]',
  sm: 'h-10 px-[var(--padding-lg)] py-[var(--padding-sm)] text-text-md rounded-[var(--radius-xs)] gap-[var(--gap-xs)]',
  xs: 'h-7  px-[var(--padding-md)] py-[var(--padding-xxs)] text-text-sm rounded-[var(--radius-xxs)] gap-[var(--gap-xs)]',
};

export function Button({
  label,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        // Base
        'inline-flex items-center justify-center',
        'font-body font-semibold whitespace-nowrap',
        'transition-colors duration-150',
        'shadow-xs',
        'disabled:cursor-not-allowed disabled:opacity-60',
        // Variante + Tamanho
        variantClasses[variant],
        sizeClasses[size],
        // Largura
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner variant={variant} />
      ) : (
        <>
          {iconLeft  && <span className="shrink-0">{iconLeft}</span>}
          <span>{label}</span>
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
}

// Spinner interno — cor adapta à variante
function Spinner({ variant }: { variant: ButtonVariant }) {
  const color = variant === 'secondary' || variant === 'tertiary'
    ? 'var(--color-neutral-foreground-fg-high-contrast)'
    : 'var(--color-static-neutral-white)';

  return (
    <svg
      className="animate-spin h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
