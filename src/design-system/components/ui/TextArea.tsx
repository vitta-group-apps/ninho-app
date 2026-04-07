/**
 * NINHO DESIGN SYSTEM — TextArea
 *
 * Tokens idênticos ao TextInput (node 2565:21366)
 * Container visual, label, hint, error: mesmos tokens literais.
 * Diferenças: <textarea>, resize vertical, min-height, counter.
 */

import React, { useId, useState } from 'react';
import { cn } from '../../lib/utils';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:            string;
  optional?:         boolean;
  required?:         boolean;
  information?:      boolean;
  hint?:             string;
  error?:            string;
  /** Linhas mínimas visíveis (default: 3) */
  minRows?:          number;
  /** Mostra contador de caracteres — requer maxLength */
  showCounter?:      boolean;
  fullWidth?:        boolean;
  noResize?:         boolean;
  wrapperClassName?: string;
}

export function TextArea({
  label,
  optional    = false,
  required    = false,
  information = false,
  hint,
  error,
  minRows     = 3,
  showCounter = false,
  fullWidth   = true,
  noResize    = false,
  disabled,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  id: externalId,
  className,
  wrapperClassName,
  maxLength,
  placeholder = 'Placeholder',
  ...props
}: TextAreaProps) {
  const autoId   = useId();
  const id       = externalId ?? autoId;
  const hintId   = `${id}-hint`;
  const errorId  = `${id}-error`;

  const hasError   = !!error;
  const isDisabled = !!disabled;

  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [charCount, setCharCount] = useState(() =>
    String(value ?? defaultValue ?? '').length
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (showCounter) setCharCount(e.target.value.length);
    onChange?.(e);
  };

  // Estado derivado igual ao TextInput
  type State = 'default' | 'hover' | 'focus' | 'error' | 'disabled';
  const state: State = isDisabled
    ? 'disabled'
    : hasError
    ? 'error'
    : isFocused
    ? 'focus'
    : isHovered
    ? 'hover'
    : 'default';

  const containerStyles = {
    default:  "bg-[var(--pure-neutral\\/white,#fcfcfc)] border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    hover:    "bg-[var(--pure-neutral\\/white,#fcfcfc)] border-[var(--accent\\/background\\/bg-subtle_enabled,#faf3fc)] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    focus:    "bg-[var(--pure-neutral\\/white,#fcfcfc)] border-[var(--accent\\/background\\/bg-tint_01,#8b5e96)] shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    error:    "bg-[var(--error\\/background\\/bg-subtle_enabled,#ecd3d0)] border-[var(--error\\/border\\/border-subtle_pressed,#75241a)] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    disabled: "bg-[var(--neutral-disabled\\/bg-disabled,rgba(206,204,202,0.32))] border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)]",
  } as const;

  const textColor = {
    default:  "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]",
    hover:    "text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]",
    focus:    "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]",
    error:    "text-[color:var(--error\\/background\\/bg-tint_01,#671d14)]",
    disabled: "text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]",
  } as const;

  const labelColor = hasError
    ? "text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)]"
    : isDisabled
    ? "text-[color:var(--neutral-disabled\\/fg-disabled,rgba(82,79,76,0.32))]"
    : "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]";

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

      {/* ── Label ── */}
      {label && (
        <div className="flex gap-[var(--gap-xs,4px)] items-center">
          <label
            htmlFor={id}
            className={cn(
              "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
              'font-[var(--font-weight\\/medium,500)]',
              'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
              'leading-[1.5] whitespace-nowrap',
              labelColor,
            )}
          >
            {label}
          </label>
          {optional && !required && (
            <span className={cn(
              "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
              'font-[var(--font-weight\\/regular,400)]',
              'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
              'leading-[1.5] whitespace-nowrap', labelColor,
            )}>
              (optional)
            </span>
          )}
          {required && (
            <span aria-hidden="true" className="text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)] text-[length:var(--font-sizes\\/text\\/lg,16px)] leading-[1.5]">*</span>
          )}
          {information && (
            <span className="shrink-0 size-5 flex items-center justify-center" aria-label="Informação">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 9v5M10 7h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
          )}
        </div>
      )}

      {/* ── Textarea ── */}
      <textarea
        id={id}
        rows={minRows}
        disabled={isDisabled}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={hasError || undefined}
        aria-required={required || undefined}
        aria-describedby={[hasError && errorId, hint && hintId].filter(Boolean).join(' ') || undefined}
        onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
        onBlur={(e)  => { setIsFocused(false); onBlur?.(e); }}
        onChange={handleChange}
        onMouseEnter={() => !isDisabled && !hasError && !isFocused && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'w-full border-[1.5px] border-solid outline-none',
          'rounded-[var(--radius-xs,6px)]',
          'px-[var(--padding-lg,16px)] py-[var(--padding-md,12px)]',
          'transition-all duration-150',
          "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
          'font-[var(--font-weight\\/regular,400)]',
          'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
          'leading-[1.5]',
          textColor[state],
          `placeholder:text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]`,
          containerStyles[state],
          noResize ? 'resize-none' : 'resize-y',
          isDisabled && 'cursor-not-allowed',
          className,
        )}
        {...props}
      />

      {/* ── Rodapé ── */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex-1">
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

        {showCounter && maxLength !== undefined && (
          <p
            aria-live="polite"
            className={cn(
              "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
              'font-[var(--font-weight\\/regular,400)]',
              'text-[length:var(--font-sizes\\/text\\/md,14px)]',
              'leading-[1.5] whitespace-nowrap shrink-0',
              charCount >= maxLength
                ? 'text-[color:var(--error\\/foreground\\/fg-low-contrast,#671d14)]'
                : 'text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]',
            )}
          >
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
