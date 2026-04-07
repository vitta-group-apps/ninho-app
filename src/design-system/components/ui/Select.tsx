/**
 * NINHO DESIGN SYSTEM — Select + Dropdown
 * Nodes Figma: 3030:2815 (Select) | 5754:2403 (Dropdown)
 * Nitro™ Core v3.0
 *
 * Tokens (get_variable_defs confirmado):
 *   Select Default:  bg=#fcfcfc  border=1.5px #a9a5a2  shadow-xs  radius=6px
 *   Select Hover:    bg=#eeedec  border=1.5px #8a8480
 *   Select Focus:    bg=#fcfcfc  ring=rgba(13,13,13,0.12) 4px
 *   Select Disabled: bg=rgba(206,204,202,0.32)  sem border/shadow
 *   Texto default:   #524f4c  |  hover/focus com valor: #3a3836
 *   Texto disabled:  rgba(82,79,76,0.32)
 *   sm: h=40px p=8px  text=12px icon=16px
 *   md: h=48px p=12px text=14px icon=24px
 *   lg: h=56px p=16px text=16px icon=24px
 *   Dropdown: bg=#fcfcfc border=1px #a9a5a2 radius=8px shadow-sm p=4px gap=4px mt=9px
 *   Item: h=40px px=16px py=12px radius=6px
 *   Item hover: bg=#eeedec text=#3a3836 | default: bg=#fcfcfc text=#524f4c
 */

import React, { useId, useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

export interface SelectProps {
  options:         SelectOption[];
  value?:          string;
  defaultValue?:   string;
  onValueChange?:  (value: string) => void;
  placeholder?:    string;
  size?:           SelectSize;
  disabled?:       boolean;
  className?:      string;
  id?:             string;
}

const HEIGHT: Record<SelectSize, string>   = { sm: 'h-[40px]', md: 'h-[48px]', lg: 'h-[56px]' };
const PADDING: Record<SelectSize, string>  = { sm: 'p-[8px]',  md: 'p-[12px]', lg: 'p-[16px]' };
const TSIZE: Record<SelectSize, string>    = { sm: 'text-[12px]', md: 'text-[14px]', lg: 'text-[16px]' };
const ISIZE: Record<SelectSize, string>    = { sm: 'size-4', md: 'size-6', lg: 'size-6' };

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('shrink-0 transition-transform duration-200', className)}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Select({ options, value, defaultValue = '', onValueChange, placeholder = 'Selecione', size = 'md', disabled = false, className, id: externalId }: SelectProps) {
  const autoId        = useId();
  const id            = externalId ?? autoId;
  const isControlled  = value !== undefined;
  const [internal, setInternal]           = useState(defaultValue);
  const [open, setOpen]                   = useState(false);
  const [focused, setFocused]             = useState(false);
  const [hovered, setHovered]             = useState(false);
  const [hoveredOpt, setHoveredOpt]       = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const selectedValue = isControlled ? value! : internal;
  const selectedLabel = options.find(o => o.value === selectedValue)?.label ?? '';

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setFocused(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    if (!isControlled) setInternal(opt.value);
    onValueChange?.(opt.value);
    setOpen(false);
  };

  const triggerClass = cn(
    'flex items-center overflow-hidden w-full rounded-[6px] transition-all duration-150 cursor-pointer focus-visible:outline-none gap-[8px]',
    HEIGHT[size], PADDING[size],
    disabled
      ? 'bg-[rgba(206,204,202,0.32)] cursor-not-allowed pointer-events-none'
      : focused
      ? 'bg-[#fcfcfc] border-[1.5px] border-[#a9a5a2] shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]'
      : hovered
      ? 'bg-[#eeedec] border-[1.5px] border-[#8a8480] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]'
      : 'bg-[#fcfcfc] border-[1.5px] border-[#a9a5a2] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
  );

  const textColor = disabled
    ? 'text-[rgba(82,79,76,0.32)]'
    : (hovered || focused) && selectedLabel ? 'text-[#3a3836]'
    : 'text-[#524f4c]';

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <button type="button" id={id} aria-haspopup="listbox" aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen(p => !p)}
        onFocus={() => setFocused(true)}
        onBlur={() => { if (!open) setFocused(false); }}
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={triggerClass}
      >
        <span className={cn("flex-1 min-w-0 px-[4px] font-[family-name:var(--font-family\/text,'Nunito',sans-serif)]", 'font-[var(--font-weight\/medium,500)] leading-[1.5] truncate text-left', TSIZE[size], textColor)}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn(ISIZE[size], disabled ? 'text-[rgba(82,79,76,0.32)]' : 'text-[#524f4c]', open && 'rotate-180')} />
      </button>

      {open && !disabled && (
        <div role="listbox" aria-labelledby={id}
          className="absolute left-0 right-0 z-50 mt-[9px] flex flex-col gap-[4px] p-[4px] bg-[#fcfcfc] border border-[#a9a5a2] rounded-[8px] shadow-[0px_1px_3px_0px_rgba(13,13,13,0.04),0px_1px_2px_0px_rgba(13,13,13,0.04)]">
          {options.map(opt => (
            <button key={opt.value} type="button" role="option"
              aria-selected={opt.value === selectedValue}
              disabled={opt.disabled}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHoveredOpt(opt.value)}
              onMouseLeave={() => setHoveredOpt(null)}
              className={cn(
                'flex items-center w-full h-[40px] rounded-[6px] gap-[8px] px-[16px] py-[12px]',
                'transition-colors duration-100 cursor-pointer focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.12)]',
                hoveredOpt === opt.value ? 'bg-[#eeedec] text-[#3a3836]' : 'bg-[#fcfcfc] text-[#524f4c]',
                opt.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <span className="flex-1 font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[14px] leading-[1.5] text-left truncate">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
