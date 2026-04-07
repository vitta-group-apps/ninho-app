/**
 * NINHO DESIGN SYSTEM — Checkbox
 * Node Figma: 2314:4232 | Nitro™ Core v3.0
 *
 * Tokens (confirmados via get_variable_defs):
 *   radius-xxs = 4px
 *   Unchecked:  bg=#f8f7f7  border=1.25px #a9a5a2  shadow-xs
 *   Checked:    bg=#8b5e96  shadow-xs
 *   Hover:      bg=#6e2880
 *   Focus unchecked: border=#d8b9df  ring=rgba(103,32,121,0.32) 4px
 *   Focus checked:   bg=#8b5e96  ring=rgba(103,32,121,0.32) 4px
 *   Disabled unchecked: bg=rgba(206,204,202,0.32)  border=rgba(13,13,13,0.12)
 *   Disabled checked:   bg=#faf3fc (lilás muito claro)
 *   Container pt-[2px] para alinhar com texto
 *   Gap: padding-md (12px)
 *   Label: Nunito Medium 14px #3a3836
 *   Desc:  Nunito Regular 14px #524f4c
 */

import React, { useId, useState } from 'react';
import { cn } from '../../lib/utils';

export type CheckboxSize = 'lg' | 'md';

export interface CheckboxProps {
  checked?:          boolean;
  defaultChecked?:   boolean;
  indeterminate?:    boolean;
  onCheckedChange?:  (checked: boolean) => void;
  label?:            string;
  description?:      string;
  size?:             CheckboxSize;
  disabled?:         boolean;
  id?:               string;
  className?:        string;
}

const BOX_SIZE: Record<CheckboxSize, string> = {
  lg: 'w-[20px] h-[20px]',
  md: 'w-[16px] h-[16px]',
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 9" fill="none" className="w-full h-full" aria-hidden="true">
      <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IndeterminateIcon({ size }: { size: CheckboxSize }) {
  return (
    <svg viewBox="0 0 8 2" fill="none" className="w-full h-full" aria-hidden="true">
      <line x1="0" y1="1" x2="8" y2="1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CheckboxBox({ checked, indeterminate, disabled, focused, hovered, size }: {
  checked: boolean; indeterminate: boolean; disabled: boolean;
  focused: boolean; hovered: boolean; size: CheckboxSize;
}) {
  const isActive = checked || indeterminate;

  let boxClass: string;
  if (disabled) {
    boxClass = isActive
      ? cn('rounded-[4px] overflow-hidden', BOX_SIZE[size], 'bg-[#faf3fc]')
      : cn('rounded-[4px] overflow-hidden', BOX_SIZE[size], 'bg-[rgba(206,204,202,0.32)] border-[1.25px] border-[rgba(13,13,13,0.12)]');
  } else if (isActive) {
    const bg = hovered ? 'bg-[#6e2880]' : 'bg-[#8b5e96]';
    const shadow = focused
      ? 'shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]'
      : 'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]';
    boxClass = cn('rounded-[4px] overflow-hidden', BOX_SIZE[size], bg, shadow);
  } else {
    const border = focused ? 'border-[#d8b9df]' : 'border-[#a9a5a2]';
    const shadow = focused
      ? 'shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]'
      : 'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]';
    boxClass = cn('rounded-[4px] overflow-hidden', BOX_SIZE[size], 'bg-[#f8f7f7] border-[1.25px]', border, shadow);
  }

  return (
    <div className={cn('relative shrink-0', boxClass)}>
      {checked && !indeterminate && (
        <div className="absolute inset-[31.25%_21.88%_34.38%_25%]">
          <CheckIcon />
        </div>
      )}
      {indeterminate && (
        <div className="absolute inset-x-[18.75%] top-1/2 -translate-y-1/2 h-[1.5px]">
          <IndeterminateIcon size={size} />
        </div>
      )}
    </div>
  );
}

export function Checkbox({
  checked, defaultChecked = false, indeterminate = false,
  onCheckedChange, label, description,
  size = 'lg', disabled = false, id: externalId, className,
}: CheckboxProps) {
  const autoId       = useId();
  const id           = externalId ?? autoId;
  const labelId      = `${id}-label`;
  const descId       = `${id}-desc`;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const [focused,  setFocused]  = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const isChecked = isControlled ? checked! : internal;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  return (
    <div
      className={cn('flex items-start gap-[12px]', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-center pt-[2px] shrink-0">
        <button
          type="button"
          role="checkbox"
          id={id}
          aria-checked={indeterminate ? 'mixed' : isChecked}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={description ? descId : undefined}
          disabled={disabled}
          onClick={toggle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); toggle(); } }}
          className="focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed"
        >
          <CheckboxBox checked={isChecked} indeterminate={indeterminate}
            disabled={disabled} focused={focused} hovered={hovered} size={size} />
        </button>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label id={labelId} htmlFor={id}
              className={cn(
                "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)]",
                'font-[var(--font-weight\/medium,500)] text-[14px] leading-[1.5]',
                'text-[#3a3836]',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              )}>
              {label}
            </label>
          )}
          {description && (
            <span id={descId}
              className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[14px] leading-[1.5] text-[#524f4c]">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
