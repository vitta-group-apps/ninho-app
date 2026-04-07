/**
 * NINHO DESIGN SYSTEM — TextInput
 *
 * Node Figma: 2565:21366 | Nitro™ Core v3.0
 * Tokens extraídos LITERALMENTE do Figma Dev Mode
 *
 * Variantes: Large (56px) | Medium (48px) | Small (40px)
 * Estados:   Default | Hover | Focus | Filled | Error | Disabled
 * Slots:     label, hint, error, optional, required, information, iconLeft, iconRight
 */

import React, { useId, useState } from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type TextInputSize  = 'lg' | 'md' | 'sm';
export type TextInputState = 'default' | 'hover' | 'focus' | 'filled' | 'error' | 'disabled';

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Texto do label acima do campo */
  label?:        string;
  /** Mostra indicador "(optional)" */
  optional?:     boolean;
  /** Mostra asterisco required — sobrepõe optional */
  required?:     boolean;
  /** Mostra ícone de informação no label */
  information?:  boolean;
  /** Texto auxiliar abaixo do campo */
  hint?:         string;
  /** Mensagem de erro — ativa estado Error visualmente */
  error?:        string;
  /** Tamanho: lg=56px | md=48px | sm=40px */
  size?:         TextInputSize;
  /** Ícone à esquerda */
  iconLeft?:     React.ReactNode;
  /** Ícone à direita */
  iconRight?:    React.ReactNode;
  /** Expande para 100% da largura */
  fullWidth?:    boolean;
  /** Classe extra para o wrapper */
  wrapperClassName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS LITERAIS DO FIGMA (node 2565:21366)
//
// Container — Default/Hover:
//   bg      = var(--pure-neutral/white, #fcfcfc)
//   border  = 1.5px var(--neutral/border/border-subtle_enabled, #a9a5a2)
//   shadow  = 0px 1px 2px rgba(13,13,13,0.04)
//   radius  = var(--radius-xs, 6px)
//
// Container — Hover (border muda):
//   border  = 1.5px var(--accent/background/bg-subtle_enabled, #faf3fc)
//
// Container — Focus:
//   border  = 1.5px var(--accent/background/bg-tint_01, #8b5e96)
//   shadow  = 0px 0px 0px 4px rgba(103,32,121,0.32), 0px 1px 2px rgba(13,13,13,0.04)
//
// Container — Error:
//   bg      = var(--error/background/bg-subtle_enabled, #ecd3d0)
//   border  = 1.5px var(--error/border/border-subtle_pressed, #75241a)
//   shadow  = 0px 1px 2px rgba(13,13,13,0.04)
//
// Container — Disabled:
//   bg      = var(--neutral-disabled/bg-disabled, rgba(206,204,202,0.32))
//   border  = 1.5px var(--neutral/border/border-subtle_enabled, #a9a5a2)
//
// Texto placeholder:
//   Default/Hover: color = var(--neutral/foreground/fg-low-contrast, #524f4c)
//   Focus/Filled:  color = var(--neutral/foreground/fg-high-contrast, #3a3836)
//   Error:         color = var(--error/background/bg-tint_01, #671d14)
//   Disabled:      color = var(--neutral-disabled/fg-disabled, rgba(82,79,76,0.32))
//
// Font sizes:
//   Large:  font-sizes/text/lg (16px)   Medium: font-sizes/text/md (14px)   Small: font-sizes/text/sm (12px)
//
// Padding:
//   Large: padding-lg (16px)   Medium: padding-md (12px)   Small: padding-sm (8px)
//
// Label — Default:
//   color = var(--neutral/foreground/fg-high-contrast, #3a3836)
//   font  = Nunito Medium 16px (lg/md) | 14px (sm)
//
// Label — Error:
//   color = var(--error/foreground/fg-low-contrast, #671d14)
//
// Label — Disabled:
//   color = var(--neutral-disabled/fg-disabled, rgba(82,79,76,0.32))
//
// Hint — Default:
//   color = var(--neutral/foreground/fg-low-contrast, #524f4c)   font = Regular 14px
//
// Hint — Error:
//   color = var(--error/foreground/fg-low-contrast, #671d14)
//
// Hint — Disabled:
//   color = var(--neutral-disabled/fg-disabled, rgba(82,79,76,0.32))
//
// Required asterisk: color = var(--error/foreground/fg-low-contrast, #671d14)
// ─────────────────────────────────────────────────────────────────────────────

// Padding por tamanho (literais do Figma)
const CONTAINER_PADDING: Record<TextInputSize, string> = {
  lg: 'px-[var(--padding-lg,16px)]',
  md: 'px-[var(--padding-md,12px)]',
  sm: 'px-[var(--padding-sm,8px)]',
};

// Altura por tamanho
const CONTAINER_HEIGHT: Record<TextInputSize, string> = {
  lg: 'h-14',   // 56px
  md: 'h-12',   // 48px
  sm: 'h-10',   // 40px
};

// Font size do input por tamanho
const INPUT_FONT_SIZE: Record<TextInputSize, string> = {
  lg: 'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
  md: 'text-[length:var(--font-sizes\\/text\\/md,14px)]',
  sm: 'text-[length:var(--font-sizes\\/text\\/sm,12px)]',
};

// Tamanho do ícone por tamanho do campo
const ICON_SIZE: Record<TextInputSize, string> = {
  lg: 'size-6',  // 24px
  md: 'size-6',  // 24px
  sm: 'size-4',  // 16px
};

export function TextInput({
  label,
  optional    = false,
  required    = false,
  information = false,
  hint,
  error,
  size        = 'md',
  iconLeft,
  iconRight,
  fullWidth   = true,
  disabled,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  id: externalId,
  className,
  wrapperClassName,
  placeholder = 'Placeholder',
  ...props
}: TextInputProps) {
  const autoId   = useId();
  const id       = externalId ?? autoId;
  const hintId   = `${id}-hint`;
  const errorId  = `${id}-error`;

  const hasError    = !!error;
  const isDisabled  = disabled || props['aria-disabled'] === true;

  // Estado interno de foco/hover para aplicar estilos fiéis ao Figma
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Detecta se tem conteúdo (filled)
  const [isFilled, setIsFilled] = useState(() => {
    return !!(value ?? defaultValue);
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFilled(e.target.value.length > 0);
    onChange?.(e);
  };

  // Estado derivado — mesma lógica do Figma
  const state: TextInputState = isDisabled
    ? 'disabled'
    : hasError
    ? 'error'
    : isFocused
    ? 'focus'
    : isFilled
    ? 'filled'
    : isHovered
    ? 'hover'
    : 'default';

  // ── Estilos do container por estado ──────────────────────────────
  const containerStyles = {
    default:  "bg-[var(--pure-neutral\\/white,#fcfcfc)] border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    hover:    "bg-[var(--pure-neutral\\/white,#fcfcfc)] border-[var(--accent\\/background\\/bg-subtle_enabled,#faf3fc)] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    focus:    "bg-[var(--pure-neutral\\/white,#fcfcfc)] border-[var(--accent\\/background\\/bg-tint_01,#8b5e96)] shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    filled:   "bg-[var(--pure-neutral\\/white,#fcfcfc)] border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    error:    "bg-[var(--error\\/background\\/bg-subtle_enabled,#ecd3d0)] border-[var(--error\\/border\\/border-subtle_pressed,#75241a)] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    disabled: "bg-[var(--neutral-disabled\\/bg-disabled,rgba(206,204,202,0.32))] border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)]",
  } as const;

  // ── Cor do texto/placeholder por estado ──────────────────────────
  const textColor = {
    default:  "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]",
    hover:    "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]",
    focus:    "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]",
    filled:   "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]",
    error:    "text-[color:var(--error\\/background\\/bg-tint_01,#671d14)]",
    disabled: "text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]",
  } as const;

  // ── Cor do ícone por estado ──────────────────────────────────────
  const iconColor = {
    default:  "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]",
    hover:    "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]",
    focus:    "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]",
    filled:   "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]",
    error:    "text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)]",
    disabled: "text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]",
  } as const;

  // ── Cor do label por estado ──────────────────────────────────────
  const labelColor = hasError
    ? "text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)]"
    : isDisabled
    ? "text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]"
    : "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]";

  // ── Font size do label por tamanho ───────────────────────────────
  const labelFontSize = size === 'sm'
    ? 'text-[length:var(--font-sizes\\/text\\/md,14px)]'
    : 'text-[length:var(--font-sizes\\/text\\/lg,16px)]';

  // ── Cor do hint por estado ───────────────────────────────────────
  const hintColor = hasError
    ? "text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)]"
    : isDisabled
    ? "text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]"
    : "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]";

  return (
    <div className={cn(
      'flex flex-col gap-[var(--padding-sm,8px)] items-start',
      fullWidth ? 'w-full' : '',
      wrapperClassName,
    )}>

      {/* ── Label ─────────────────────────────────────────────── */}
      {label && (
        <div className="flex gap-[var(--gap-xs,4px)] items-center">
          <label
            htmlFor={id}
            className={cn(
              "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
              'font-[var(--font-weight\\/medium,500)]',
              'leading-[1.5] whitespace-nowrap',
              labelFontSize,
              labelColor,
            )}
          >
            {label}
          </label>

          {optional && !required && (
            <span className={cn(
              "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
              'font-[var(--font-weight\\/regular,400)]',
              'leading-[1.5] whitespace-nowrap',
              labelFontSize,
              labelColor,
            )}>
              (optional)
            </span>
          )}

          {required && (
            <span
              aria-hidden="true"
              className={cn(
                "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
                'font-[var(--font-weight\\/regular,400)]',
                'leading-[1.5]',
                'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
                'text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)]',
              )}
            >
              *
            </span>
          )}

          {information && (
            <span className="shrink-0 size-5 flex items-center justify-center" aria-label="Informação">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" className={labelColor} />
                <path d="M10 9v5M10 7h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={labelColor} />
              </svg>
            </span>
          )}
        </div>
      )}

      {/* ── Campo ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center border-[1.5px] border-solid overflow-hidden',
          'rounded-[var(--radius-xs,6px)]',
          'transition-all duration-150',
          CONTAINER_HEIGHT[size],
          CONTAINER_PADDING[size],
          'gap-[var(--gap-sm,8px)]',
          fullWidth ? 'w-full' : '',
          containerStyles[state],
          isDisabled && 'cursor-not-allowed',
        )}
        onMouseEnter={() => !isDisabled && !hasError && !isFocused && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Ícone esquerdo */}
        {iconLeft && (
          <span className={cn('shrink-0 flex items-center', ICON_SIZE[size], iconColor[state])} aria-hidden="true">
            {iconLeft}
          </span>
        )}

        {/* Input nativo */}
        <input
          id={id}
          disabled={isDisabled}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-invalid={hasError || undefined}
          aria-required={required || undefined}
          aria-describedby={[hasError && errorId, (hint) && hintId].filter(Boolean).join(' ') || undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            'flex-1 min-w-0 bg-transparent border-none outline-none',
            "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
            // Filled usa Medium, os demais Regular
            state === 'filled'
              ? 'font-[var(--font-weight\\/medium,500)]'
              : 'font-[var(--font-weight\\/regular,400)]',
            'leading-[1.5]',
            INPUT_FONT_SIZE[size],
            textColor[state],
            `placeholder:text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]`,
            isDisabled && 'cursor-not-allowed',
            className,
          )}
          {...props}
        />

        {/* Ícone direito */}
        {iconRight && (
          <span className={cn('shrink-0 flex items-center', ICON_SIZE[size], iconColor[state])} aria-hidden="true">
            {iconRight}
          </span>
        )}
      </div>

      {/* ── Error / Hint ──────────────────────────────────────── */}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className={cn(
            "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
            'font-[var(--font-weight\\/regular,400)]',
            'text-[length:var(--font-sizes\\/text\\/md,14px)]',
            'leading-[1.5]',
            'text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)]',
          )}
        >
          {error}
        </p>
      )}

      {hint && !hasError && (
        <p
          id={hintId}
          className={cn(
            "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
            'font-[var(--font-weight\\/regular,400)]',
            'text-[length:var(--font-sizes\\/text\\/md,14px)]',
            'leading-[1.5]',
            hintColor,
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
