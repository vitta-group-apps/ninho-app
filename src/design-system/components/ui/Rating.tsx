/**
 * NINHO DESIGN SYSTEM — Rating
 * Node Figma: 2558:11522 | Nitro™ Core v3.0
 *
 * Tokens (confirmados via get_variable_defs):
 *   sun/500      = #EEC458  ← estrela preenchida
 *   overlay/200  = rgba(13,13,13,0.24) ← estrela vazia
 *   label:  Nunito Medium 14px  #3a3836
 *   hint:   Nunito Regular 14px #524f4c
 *   gap estrelas: 2px  |  gap container: 8px
 *   Small=20px  Medium=24px  Large=28px
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export type RatingSize = 'sm' | 'md' | 'lg';

export interface RatingProps {
  value?:          number;
  defaultValue?:   number;
  onValueChange?:  (value: number) => void;
  size?:           RatingSize;
  label?:          string;
  hint?:           string;
  readOnly?:       boolean;
  disabled?:       boolean;
  className?:      string;
}

const STAR_FILL   = '#EEC458';
const STAR_BORDER = 'rgba(13,13,13,0.24)';
const STAR_SIZE: Record<RatingSize, number> = { sm: 20, md: 24, lg: 28 };

function StarIcon({ state, size, id }: { state: 'fill' | 'border' | 'half'; size: number; id: string }) {
  const PATH = "M12 2l2.93 6.26L22 9.27l-5.5 5.12 1.36 7.34L12 18.27l-5.86 3.46L7.5 14.39 2 9.27l7.07-1.01L12 2z";
  if (state === 'fill') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={PATH} fill={STAR_FILL} />
      </svg>
    );
  }
  if (state === 'half') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <defs>
          <clipPath id={`hl-${id}`}><rect x="0" y="0" width="12" height="24" /></clipPath>
          <clipPath id={`hr-${id}`}><rect x="12" y="0" width="12" height="24" /></clipPath>
        </defs>
        <path d={PATH} fill={STAR_FILL} clipPath={`url(#hl-${id})`} />
        <path d={PATH} fill="none" stroke={STAR_FILL} strokeWidth="1.5" clipPath={`url(#hr-${id})`} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={PATH} fill="none" stroke={STAR_BORDER} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Rating({ value, defaultValue = 0, onValueChange, size = 'sm', label, hint, readOnly = false, disabled = false, className }: RatingProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const [hovered, setHovered] = useState(0);
  const currentValue = isControlled ? value! : internal;
  const displayValue = (!readOnly && !disabled && hovered > 0) ? hovered : currentValue;
  const px = STAR_SIZE[size];

  const handleClick = (star: number) => {
    if (readOnly || disabled) return;
    const next = star === currentValue ? 0 : star;
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <div className={cn('flex items-center gap-[8px] overflow-hidden', disabled && 'opacity-40 cursor-not-allowed', className)}>
      {label && (
        <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[14px] leading-[1.5] whitespace-nowrap text-[#3a3836]">
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={label ?? 'Rating'}
        className={cn('flex items-center gap-[2px]', !readOnly && !disabled && 'cursor-pointer')}
        onMouseLeave={() => !readOnly && !disabled && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const state: 'fill' | 'border' | 'half' =
            displayValue >= star ? 'fill' :
            displayValue >= star - 0.5 ? 'half' : 'border';
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={currentValue === star}
              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
              disabled={disabled || readOnly}
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readOnly && !disabled && setHovered(star)}
              className={cn(
                'relative block overflow-hidden shrink-0 focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-[rgba(238,196,88,0.5)] rounded-sm',
                !readOnly && !disabled ? 'cursor-pointer' : 'cursor-default',
              )}
              style={{ width: px, height: px }}
            >
              <StarIcon state={state} size={px} id={`${star}`} />
            </button>
          );
        })}
      </div>
      {hint && (
        <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[14px] leading-[1.5] whitespace-nowrap text-[#524f4c]">
          {hint}
        </span>
      )}
    </div>
  );
}
