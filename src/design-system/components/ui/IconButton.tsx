/**
 * NINHO DESIGN SYSTEM — IconButton
 * Node Figma: 2131:6885 | Nitro™ Core v3.0
 *
 * Type:  Primary | Secondary | Tertiary
 * Size:  xxl (56) | xl (48) | lg (40) | md (32) | sm (28) | xs (24)
 * State: Default | Hover | Focus | Disabled
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type IconButtonSize    = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ícone a ser renderizado — obrigatório para acessibilidade, use aria-label */
  icon:      React.ReactNode;
  variant?:  IconButtonVariant;
  size?:     IconButtonSize;
}

// ── Tokens do Figma (node 2131:6885) ──────────────────────────────────────
//
// Primary:
//   default:  bg=accent/bg-tint_01 (#8b5e96)  shadow-xs
//   hover:    bg=accent/bg-tint_02 (#6e2880)
//   focus:    bg=tint_02 + ring=rgba(103,32,121,0.32)
//   disabled: bg=rgba(216,185,223,0.32)  sem shadow
//
// Secondary:
//   default:  bg=neutral/bg-subtle_01 (#f8f7f7)  border=1px neutral  shadow-xs
//   hover:    mesmo bg + cursor-pointer
//   focus:    ring=rgba(13,13,13,0.12)
//   disabled: bg=rgba(206,204,202,0.32)  sem border  sem shadow
//
// Tertiary:
//   default:  bg=transparent  shadow-xs
//   hover:    bg=neutral/bg-subtle_01 (#f8f7f7)
//   focus:    bg=neutral/bg-subtle_01 + ring=rgba(13,13,13,0.12)
//   disabled: bg=transparent  sem shadow
//
// Padding por tamanho: xxl=16px | xl=12px | lg=8px | md=8px | sm=6px | xs=4px
// Ícone: 24px para xxl/xl/lg | 16px para md/sm/xs
// ──────────────────────────────────────────────────────────────────────────

const PADDING: Record<IconButtonSize, string> = {
  xxl: 'p-[16px]',
  xl:  'p-[12px]',
  lg:  'p-[8px]',
  md:  'p-[8px]',
  sm:  'p-[6px]',
  xs:  'p-[4px]',
};

const ICON_SIZE: Record<IconButtonSize, string> = {
  xxl: 'size-6',  // 24px
  xl:  'size-6',
  lg:  'size-6',
  md:  'size-4',  // 16px
  sm:  'size-4',
  xs:  'size-4',
};

const VARIANT: Record<IconButtonVariant, string> = {
  primary: cn(
    'bg-[var(--accent\\/background\\/bg-tint_01,#8b5e96)]',
    'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
    'hover:bg-[var(--accent\\/background\\/bg-tint_02,#6e2880)]',
    'focus-visible:bg-[var(--accent\\/background\\/bg-tint_02,#6e2880)]',
    'focus-visible:shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]',
    'disabled:bg-[rgba(216,185,223,0.32)] disabled:shadow-none',
  ),
  secondary: cn(
    'bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)]',
    'border border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)]',
    'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
    'focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]',
    'disabled:bg-[rgba(206,204,202,0.32)] disabled:border-transparent disabled:shadow-none',
  ),
  tertiary: cn(
    'bg-transparent',
    'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
    'hover:bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)]',
    'focus-visible:bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)]',
    'focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]',
    'disabled:bg-transparent disabled:shadow-none',
  ),
};

export function IconButton({
  icon,
  variant   = 'primary',
  size      = 'xl',
  disabled,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center overflow-hidden',
        'rounded-[6px] transition-all duration-150 cursor-pointer',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:pointer-events-none',
        PADDING[size],
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      <span className={cn('shrink-0 flex items-center', ICON_SIZE[size])}>
        {icon}
      </span>
    </button>
  );
}
