/**
 * NINHO DESIGN SYSTEM — Tabs
 * Node Figma: 2670:23317 | Nitro™ Core v3.0
 *
 * Tokens (confirmados via get_variable_defs):
 *   container:  bg=#f8f7f7  gap=padding-sm (8px)
 *   tab inativo: bg=#f8f7f7  pt=8px pb=16px px=12px
 *                ícone=24px fg-low-contrast (#524f4c)
 *                label: Nunito Medium 14px #524f4c
 *   tab ativo:   border-bottom=2px #8b5e96
 *                ícone=24px #8b5e96
 *                label: Nunito SemiBold 14px #8b5e96
 *                badge: Nunito Medium 12px #8b5e96 ex "(1)"
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  value:     string;
  label:     string;
  icon?:     React.ReactNode;
  badge?:    string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs:            TabItem[];
  value?:          string;
  defaultValue?:   string;
  onValueChange?:  (value: string) => void;
  className?:      string;
}

export function Tabs({ tabs, value, defaultValue, onValueChange, className }: TabsProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value ?? '');
  const activeValue  = isControlled ? value! : internal;

  const handleSelect = (tabValue: string, disabled?: boolean) => {
    if (disabled) return;
    if (!isControlled) setInternal(tabValue);
    onValueChange?.(tabValue);
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'flex items-center',
        'bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)]',
        'gap-[var(--padding-sm,8px)]',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => handleSelect(tab.value, tab.disabled)}
            className={cn(
              'flex items-center justify-center shrink-0 relative',
              'gap-[var(--padding-sm,8px)]',
              'pt-[var(--padding-sm,8px)] pb-[var(--padding-lg,16px)] px-[var(--padding-md,12px)]',
              'transition-all duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(103,32,121,0.4)] focus-visible:ring-offset-1',
              'rounded-t-[4px]',
              isActive
                ? 'border-b-2 border-[var(--accent\\/background\\/bg-tint_01,#8b5e96)]'
                : 'bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)] hover:bg-[rgba(139,94,150,0.06)]',
              tab.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
            )}
          >
            {tab.icon && (
              <span className={cn(
                'shrink-0 size-6 flex items-center justify-center',
                isActive ? 'text-[#8b5e96]' : 'text-[#524f4c]',
              )} aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span className={cn(
              "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)]",
              'text-[14px] leading-[1.5] whitespace-nowrap',
              isActive
                ? 'font-[600] text-[#8b5e96]'
                : 'font-[500] text-[#524f4c]',
            )}>
              {tab.label}
            </span>
            {isActive && tab.badge && (
              <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[500] text-[12px] leading-[1.5] whitespace-nowrap text-[#8b5e96]">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
