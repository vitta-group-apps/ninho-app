/**
 * NINHO DESIGN SYSTEM — LinkButton
 * Node Figma: 2789:2202 | Nitro™ Core v3.0
 *
 * Type:  Interactive | Black | Gray
 * State: Default | Hover | Focus | Disabled
 * Slots: iconLeft, iconRight, label
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type LinkButtonType = 'interactive' | 'black' | 'gray';

export interface LinkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label:       string;
  type?:       LinkButtonType;
  iconLeft?:   React.ReactNode;
  iconRight?:  React.ReactNode;
}

// ── Tokens do Figma (node 2789:2202) ──────────────────────────────────────
//
// Interactive:
//   default:  text=accent/bg-tint_01 (#8b5e96)
//   hover:    text=accent/bg-tint_02 (#6e2880)   cursor-pointer
//   focus:    bg=neutral/bg-subtle_01 + ring=rgba(103,32,121,0.32)
//   disabled: text=accent/bg-subtle_enabled (#faf3fc)  — muito apagado
//
// Black:
//   default:  text=#0d0d0e   sem bg
//   hover:    text=on-tint/black/fg-low-contrast (rgba(13,13,13,0.56))
//   focus:    bg=pure-neutral/white + ring=rgba(13,13,13,0.12)
//   disabled: text=neutral-disabled/fg-disabled (rgba(82,79,76,0.32))
//
// Gray:
//   default:  text=neutral/fg-low-contrast (#524f4c)
//   hover:    text=on-tint/black/fg-low-contrast (rgba(13,13,13,0.56))
//   focus:    bg=pure-neutral/white + ring=rgba(13,13,13,0.12)
//   disabled: text=neutral-disabled/fg-disabled (rgba(82,79,76,0.32))
//
// Font: Nunito Medium 14px | gap=4px | rounded=6px
// ──────────────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<LinkButtonType, {
  base:     string;
  hover:    string;
  focus:    string;
  disabled: string;
}> = {
  interactive: {
    base:     "text-[color:var(--accent\\/background\\/bg-tint_01,#8b5e96)]",
    hover:    "hover:text-[color:var(--accent\\/background\\/bg-tint_02,#6e2880)] hover:cursor-pointer",
    focus:    "focus-visible:bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)] focus-visible:shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    disabled: "disabled:text-[color:var(--accent\\/background\\/bg-subtle_enabled,#faf3fc)]",
  },
  black: {
    base:     "text-[#0d0d0e]",
    hover:    "hover:text-[rgba(13,13,13,0.56)] hover:cursor-pointer",
    focus:    "focus-visible:bg-[var(--pure-neutral\\/white,#fcfcfc)] focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    disabled: "disabled:text-[rgba(82,79,76,0.32)]",
  },
  gray: {
    base:     "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]",
    hover:    "hover:text-[rgba(13,13,13,0.56)] hover:cursor-pointer",
    focus:    "focus-visible:bg-[var(--pure-neutral\\/white,#fcfcfc)] focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    disabled: "disabled:text-[rgba(82,79,76,0.32)]",
  },
};

export function LinkButton({
  label,
  type      = 'interactive',
  iconLeft,
  iconRight,
  disabled,
  className,
  ...props
}: LinkButtonProps) {
  const styles = TYPE_STYLES[type];

  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-[4px] overflow-hidden',
        'rounded-[6px] transition-all duration-150',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:pointer-events-none',
        styles.base,
        styles.hover,
        styles.focus,
        styles.disabled,
        className,
      )}
      {...props}
    >
      {iconLeft && (
        <span className="shrink-0 flex items-center size-6" aria-hidden="true">
          {iconLeft}
        </span>
      )}

      <span className={cn(
        "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
        'font-[var(--font-weight\\/medium,500)]',
        'text-[length:var(--font-sizes\\/text\\/md,14px)]',
        'leading-[1.5] whitespace-nowrap',
      )}>
        {label}
      </span>

      {iconRight && (
        <span className="shrink-0 flex items-center size-6" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
}
