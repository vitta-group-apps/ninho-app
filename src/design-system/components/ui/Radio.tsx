/**
 * NINHO DESIGN SYSTEM — Radio + RadioGroup
 * Node Figma: 2357:7063 | Nitro™ Core v3.0
 *
 * Tokens (confirmados via get_variable_defs):
 *   pill = 999px
 *   Não selecionado:  bg=#f8f7f7  border=1.25px #a9a5a2  shadow-xs
 *   Selecionado:      bg=#8b5e96  dot branco centralizado  shadow-xs
 *   Hover selecionado: bg=#6e2880
 *   Focus não-sel:    border=#d8b9df  ring=rgba(103,32,121,0.32) 4px
 *   Focus sel:        bg=#8b5e96  ring=rgba(103,32,121,0.32) 4px
 *   Disabled não-sel: bg=rgba(206,204,202,0.32)  border=#a9a5a2
 *   Disabled sel:     bg=#faf3fc  dot mauve claro
 *   lg=20px dot=8px | md=16px dot=6px
 *   Container pt-[2px] | gap=12px
 *   Label: Nunito Medium 14px #3a3836
 *   Desc:  Nunito Regular 14px #524f4c
 */

import React, { useId, useState } from 'react';
import { cn } from '../../lib/utils';

export type RadioSize = 'lg' | 'md';

export interface RadioProps {
  value:         string;
  label?:        string;
  description?:  string;
  size?:         RadioSize;
  disabled?:     boolean;
  selected?:     boolean;
  onChange?:     (value: string) => void;
  id?:           string;
  name?:         string;
  className?:    string;
}

export interface RadioGroupProps {
  value?:          string;
  defaultValue?:   string;
  onValueChange?:  (value: string) => void;
  name?:           string;
  size?:           RadioSize;
  disabled?:       boolean;
  className?:      string;
  children:        React.ReactNode;
}

const CIRCLE_SIZE: Record<RadioSize, string> = { lg: 'w-[20px] h-[20px]', md: 'w-[16px] h-[16px]' };
const DOT_SIZE:    Record<RadioSize, string> = { lg: 'w-[8px] h-[8px]',   md: 'w-[6px] h-[6px]' };

function RadioCircle({ selected, disabled, focused, hovered, size }: {
  selected: boolean; disabled: boolean; focused: boolean; hovered: boolean; size: RadioSize;
}) {
  let circleClass: string;
  if (disabled) {
    circleClass = selected
      ? cn('rounded-[999px] overflow-hidden', CIRCLE_SIZE[size], 'bg-[#faf3fc]')
      : cn('rounded-[999px]', CIRCLE_SIZE[size], 'bg-[rgba(206,204,202,0.32)] border-[1.25px] border-[#a9a5a2]');
  } else if (selected) {
    const bg     = hovered ? 'bg-[#6e2880]' : 'bg-[#8b5e96]';
    const shadow = focused
      ? 'shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]'
      : 'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]';
    circleClass = cn('rounded-[999px] overflow-hidden relative', CIRCLE_SIZE[size], bg, shadow);
  } else {
    const border = focused ? 'border-[#d8b9df]' : 'border-[#a9a5a2]';
    const shadow = focused
      ? 'shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]'
      : 'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]';
    circleClass = cn('rounded-[999px] overflow-hidden relative', CIRCLE_SIZE[size], 'bg-[#f8f7f7] border-[1.25px]', border, shadow);
  }
  const dotColor = disabled && selected ? 'bg-[rgba(139,94,150,0.4)]' : 'bg-white';
  return (
    <div className={cn('shrink-0 relative', circleClass)}>
      {(selected || (hovered && !disabled && !selected)) && (
        <span className={cn(
          'absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2',
          DOT_SIZE[size],
          selected ? dotColor : 'bg-[rgba(139,94,150,0.3)]',
        )} />
      )}
    </div>
  );
}

export function Radio({ value, label, description, size = 'lg', disabled = false, selected = false, onChange, id: externalId, name, className }: RadioProps) {
  const autoId  = useId();
  const id      = externalId ?? autoId;
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn('flex items-start gap-[12px]', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-center pt-[2px] shrink-0">
        <button
          type="button"
          role="radio"
          id={id}
          aria-checked={selected}
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-describedby={description ? `${id}-desc` : undefined}
          name={name}
          disabled={disabled}
          onClick={() => { if (!disabled && !selected) onChange?.(value); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed"
        >
          <RadioCircle selected={selected} disabled={disabled} focused={focused} hovered={hovered} size={size} />
        </button>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label id={`${id}-label`} htmlFor={id}
              className={cn("font-[family-name:var(--font-family\/text,'Nunito',sans-serif)]", 'font-[var(--font-weight\/medium,500)] text-[14px] leading-[1.5] text-[#3a3836]', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
              {label}
            </label>
          )}
          {description && (
            <span id={`${id}-desc`}
              className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[14px] leading-[1.5] text-[#524f4c]">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const RadioGroupContext = React.createContext<{
  value: string; onChange: (v: string) => void;
  name: string; size: RadioSize; disabled: boolean;
} | null>(null);

export function RadioGroup({ value, defaultValue = '', onValueChange, name: externalName, size = 'lg', disabled = false, className, children }: RadioGroupProps) {
  const autoName    = useId();
  const name        = externalName ?? autoName;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const activeValue = isControlled ? value! : internal;
  const handleChange = (v: string) => { if (!isControlled) setInternal(v); onValueChange?.(v); };
  return (
    <RadioGroupContext.Provider value={{ value: activeValue, onChange: handleChange, name, size, disabled }}>
      <div role="radiogroup" className={cn('flex flex-col gap-[12px]', className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps extends Omit<RadioProps, 'selected' | 'onChange' | 'name' | 'size'> {
  size?: RadioSize;
}

export function RadioGroupItem({ value, size: sizeProp, disabled: disabledProp, ...rest }: RadioGroupItemProps) {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) throw new Error('RadioGroupItem deve ser usado dentro de RadioGroup');
  return (
    <Radio value={value} selected={ctx.value === value} onChange={ctx.onChange}
      name={ctx.name} size={sizeProp ?? ctx.size} disabled={disabledProp ?? ctx.disabled} {...rest} />
  );
}
