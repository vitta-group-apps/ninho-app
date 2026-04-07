/**
 * NINHO DESIGN SYSTEM — Button
 *
 * Implementado a partir do Figma Dev Mode
 * Node: 2115:3905 | Arquivo: Nitro™ Core v3.0
 *
 * Tokens extraídos literalmente do Figma — nunca alterar os valores
 * sem sincronizar com o Figma via Tokens Studio.
 *
 * Variantes:  Primary | Secondary | Tertiary | Danger
 * Tamanhos:   Large (56) | Medium (48) | Small (40) | Extra Small (28)
 * Estados:    Default | Hover | Focus | Loading | Disabled
 */

import React from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize    = 'lg' | 'md' | 'sm' | 'xs';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto do botão */
  label:       string;
  /** Variante visual */
  variant?:    ButtonVariant;
  /** Tamanho — lg=56px | md=48px | sm=40px | xs=28px */
  size?:       ButtonSize;
  /** Estado de carregamento — substitui label por spinner */
  loading?:    boolean;
  /** Ícone à esquerda do label */
  iconLeft?:   React.ReactNode;
  /** Ícone à direita do label */
  iconRight?:  React.ReactNode;
  /** Expande para 100% da largura do container */
  fullWidth?:  boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS DO FIGMA → CLASSES TAILWIND
// Fonte: Figma Dev Mode, node 2115:3905
// Convenção: var(--token-name, fallback-hex)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classes base compartilhadas por todas as variantes e tamanhos.
 * Extraídas do Figma: overflow-clip, flex, items-center, justify-center,
 * gap-[var(--gap-xs,4px)], rounded-[6px], shadow-xs
 */
const BASE =
  'inline-flex items-center justify-center overflow-hidden ' +
  'gap-[var(--gap-xs,4px)] rounded-[6px] ' +
  'shadow-[0px_1px_2px_0px_var(--overlays\\/overlay-black\\/50,rgba(13,13,13,0.04))] ' +
  'transition-all duration-150 cursor-pointer ' +
  'focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:pointer-events-none';

/**
 * Estilos por variante — tokens extraídos do Figma Dev Mode.
 *
 * Primary
 *   Default:  bg=accent/background/bg-tint_01 (#8b5e96)  texto=static-neutral/white
 *   Hover:    bg=accent/background/bg-tint_02 (#6e2880)
 *   Focus:    bg=accent/background/bg-tint_02 + ring=accent-disabled/fg-disabled (rgba(103,32,121,0.32))
 *   Disabled: bg=accent-disabled/bg-disabled (rgba(216,185,223,0.32))  texto=accent-disabled/fg-disabled
 *
 * Secondary
 *   Default:  bg=neutral/background/bg-subtle_01 (#f8f7f7)  border=neutral/border/border-subtle_enabled (#a9a5a2)
 *   Hover:    bg=neutral/background/bg-subtle_hover (#ceccca)
 *   Focus:    border=accent/background/bg-tint_01 + ring
 *
 * Tertiary
 *   Default:  bg=neutral/background/bg-subtle_01 (#f8f7f7)  texto=neutral/foreground/fg-high-contrast (#3a3836)
 *   Hover:    bg=neutral/background/bg-subtle_hover (#ceccca)
 *
 * Danger
 *   Default:  bg=error/background/bg-tint_01 (clay-800)  texto=static-neutral/white
 *   Hover:    bg=error/background/bg-tint_02 (clay-900)
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: cn(
    // default
    'bg-[var(--accent\\/background\\/bg-tint_01,#8b5e96)]',
    'text-[color:var(--static-neutral\\/white,#fcfcfc)]',
    // hover
    'hover:bg-[var(--accent\\/background\\/bg-tint_02,#6e2880)]',
    // focus
    'focus-visible:bg-[var(--accent\\/background\\/bg-tint_02,#6e2880)]',
    'focus-visible:shadow-[0px_0px_0px_4px_var(--accent-disabled\\/fg-disabled,rgba(103,32,121,0.32)),0px_1px_2px_0px_var(--overlays\\/overlay-black\\/50,rgba(13,13,13,0.04))]',
    // disabled
    'disabled:bg-[var(--accent-disabled\\/bg-disabled,rgba(216,185,223,0.32))]',
    'disabled:text-[color:var(--accent-disabled\\/fg-disabled,rgba(103,32,121,0.32))]',
    'disabled:shadow-none',
  ),

  secondary: cn(
    // default — bg neutro + borda
    'bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)]',
    'text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]',
    'border border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)]',
    // hover
    'hover:bg-[var(--neutral\\/background\\/bg-subtle_hover,#ceccca)]',
    // focus
    'focus-visible:border-[var(--accent\\/background\\/bg-tint_01,#8b5e96)]',
    'focus-visible:shadow-[0px_0px_0px_4px_var(--accent-disabled\\/fg-disabled,rgba(103,32,121,0.32)),0px_1px_2px_0px_var(--overlays\\/overlay-black\\/50,rgba(13,13,13,0.04))]',
    // disabled
    'disabled:bg-[var(--neutral-disabled\\/bg-disabled,rgba(206,204,202,0.32))]',
    'disabled:text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]',
    'disabled:border-transparent disabled:shadow-none',
  ),

  tertiary: cn(
    // default — bg neutro sutil, sem borda
    'bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)]',
    'text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]',
    // hover
    'hover:bg-[var(--neutral\\/background\\/bg-subtle_hover,#ceccca)]',
    // focus
    'focus-visible:shadow-[0px_0px_0px_4px_var(--accent-disabled\\/fg-disabled,rgba(103,32,121,0.32)),0px_1px_2px_0px_var(--overlays\\/overlay-black\\/50,rgba(13,13,13,0.04))]',
    // disabled
    'disabled:bg-[var(--neutral-disabled\\/bg-disabled,rgba(206,204,202,0.32))]',
    'disabled:text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]',
    'disabled:shadow-none',
  ),

  danger: cn(
    // default — clay-800
    'bg-[var(--error\\/background\\/bg-tint_01,#671d14)]',
    'text-[color:var(--static-neutral\\/white,#fcfcfc)]',
    // hover — clay-900
    'hover:bg-[var(--error\\/background\\/bg-tint_02,#43140e)]',
    // focus
    'focus-visible:bg-[var(--error\\/background\\/bg-tint_02,#43140e)]',
    'focus-visible:shadow-[0px_0px_0px_4px_var(--error-disabled\\/fg-disabled,rgba(167,66,53,0.32)),0px_1px_2px_0px_var(--overlays\\/overlay-black\\/50,rgba(13,13,13,0.04))]',
    // disabled
    'disabled:bg-[var(--error-disabled\\/bg-disabled,rgba(223,185,180,0.32))]',
    'disabled:text-[color:var(--error-disabled\\/fg-disabled,rgba(103,29,20,0.32))]',
    'disabled:shadow-none',
  ),
};

/**
 * Tamanhos — alturas e paddings exatos do Figma:
 * Large (56):      h=56  px=padding-xl(20px)  py=padding-lg(16px)
 * Medium (48):     h=48  px=padding-xl(20px)  py=padding-md(12px)
 * Small (40):      h=40  px=padding-lg(16px)  py=padding-sm(8px)
 * Extra Small (28): h=28  px=padding-md(12px)  py=padding-xs(4px)
 */
const SIZE: Record<ButtonSize, string> = {
  lg: 'h-14 px-[var(--padding-xl,20px)] py-[var(--padding-lg,16px)]',
  md: 'h-12 px-[var(--padding-xl,20px)] py-[var(--padding-md,12px)]',
  sm: 'h-10 px-[var(--padding-lg,16px)]  py-[var(--padding-sm,8px)]',
  xs: 'h-7  px-[var(--padding-md,12px)]  py-[var(--padding-xs,4px)]',
};

/**
 * Tamanho de fonte por size do botão:
 * lg/md/sm → font-sizes/text/lg (16px) → Body 16/Semibold
 * xs       → font-sizes/text/md (14px)
 */
const FONT_SIZE: Record<ButtonSize, string> = {
  lg: 'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
  md: 'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
  sm: 'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
  xs: 'text-[length:var(--font-sizes\\/text\\/md,14px)]',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

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
      data-variant={variant}
      data-size={size}
      className={cn(
        BASE,
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ButtonSpinner variant={variant} size={size} />
      ) : (
        <>
          {iconLeft && (
            <span className="shrink-0 flex items-center" aria-hidden="true">
              {iconLeft}
            </span>
          )}

          {/* Label — tipografia exata do Figma: Nunito SemiBold, 1.5 line-height */}
          <span className={cn(
            'font-[family-name:var(--font-family\\/text,\'Nunito\',sans-serif)]',
            'font-[var(--font-weight\\/semi-bold,600)]',
            'leading-[1.5]',
            'whitespace-nowrap text-center',
            FONT_SIZE[size],
          )}>
            {label}
          </span>

          {iconRight && (
            <span className="shrink-0 flex items-center" aria-hidden="true">
              {iconRight}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPINNER INTERNO
// Cor adapta à variante — branco em primary/danger, escuro em secondary/tertiary
// ─────────────────────────────────────────────────────────────────────────────

function ButtonSpinner({
  variant,
  size,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
}) {
  const isLight = variant === 'primary' || variant === 'danger';
  const color = isLight
    ? 'var(--static-neutral\\/white, #fcfcfc)'
    : 'var(--neutral\\/foreground\\/fg-high-contrast, #3a3836)';

  const dim = size === 'xs' ? 14 : 16;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="8" cy="8" r="6.5"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
