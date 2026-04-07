/**
 * NINHO DESIGN SYSTEM — Switch
 * Node Figma: 2423:11468 | Nitro™ Core v3.0
 *
 * Size:   md (40×20px) | lg (48×24px)
 * State:  Default | Hover | Focus | Disabled
 * Slots:  label, description
 */

import React, { useId, useState } from 'react';
import { cn } from '../../lib/utils';

export type SwitchSize = 'md' | 'lg';

export interface SwitchProps {
  checked?:          boolean;
  defaultChecked?:   boolean;
  onCheckedChange?:  (checked: boolean) => void;
  label?:            string;
  description?:      string;
  size?:             SwitchSize;
  disabled?:         boolean;
  id?:               string;
  className?:        string;
}

const TRACK_SIZE: Record<SwitchSize, string> = {
  md: 'w-[40px] h-[20px]',
  lg: 'w-[48px] h-[24px]',
};

const THUMB_SIZE: Record<SwitchSize, string> = {
  md: 'w-[16px] h-[16px]',
  lg: 'w-[20px] h-[20px]',
};

const THUMB_TRANSLATE_ON: Record<SwitchSize, string> = {
  md: 'translate-x-[20px]',
  lg: 'translate-x-[24px]',
};

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  size     = 'md',
  disabled = false,
  id: externalId,
  className,
}: SwitchProps) {
  const autoId       = useId();
  const id           = externalId ?? autoId;
  const labelId      = `${id}-label`;
  const descId       = `${id}-desc`;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const isChecked = isControlled ? checked! : internal;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  const trackColor = disabled
    ? isChecked
      ? 'bg-[rgba(103,32,121,0.32)] shadow-none'
      : 'bg-[rgba(13,13,13,0.12)] shadow-none'
    : isChecked
    ? 'bg-[var(--accent\\/background\\/bg-tint_01,#8b5e96)] hover:bg-[var(--accent\\/background\\/bg-tint_02,#6e2880)] focus-visible:shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]'
    : 'bg-[var(--neutral\\/background\\/bg-tint_01,#524f4c)] hover:bg-[var(--neutral\\/background\\/bg-tint_02,#3a3836)] focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]';

  return (
    <div className={cn('flex items-start gap-[var(--padding-md,12px)]', className)}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={isChecked}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); toggle(); } }}
        className={cn(
          'relative inline-flex shrink-0 items-center',
          'rounded-[999px] p-[2px]',
          'transition-all duration-200',
          'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
          'focus-visible:outline-none cursor-pointer',
          TRACK_SIZE[size],
          trackColor,
          disabled && 'cursor-not-allowed pointer-events-none',
        )}
      >
        <span
          className={cn(
            'block rounded-full bg-white shrink-0',
            'shadow-[0px_1px_3px_rgba(13,13,13,0.2)]',
            'transition-transform duration-200 ease-in-out',
            THUMB_SIZE[size],
            isChecked ? THUMB_TRANSLATE_ON[size] : 'translate-x-0',
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              id={labelId}
              htmlFor={id}
              className={cn(
                "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
                'font-[var(--font-weight\\/medium,500)]',
                'text-[length:var(--font-sizes\\/text\\/md,14px)]',
                'leading-[1.5]',
                'text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span
              id={descId}
              className={cn(
                "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
                'font-[var(--font-weight\\/regular,400)]',
                'text-[length:var(--font-sizes\\/text\\/md,14px)]',
                'leading-[1.5]',
                'text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)]',
              )}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
