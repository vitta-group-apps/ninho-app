/**
 * NINHO DESIGN SYSTEM — SegmentedControl
 * Node Figma: 2670:23315 | Nitro™ Core v3.0
 *
 * Tokens (get_variable_defs confirmado):
 *   Container:  bg=neutral/background/bg-subtle_enabled (#e2e0df)
 *               p=6px  gap=8px  radius=12px
 *
 *   Item inativo:
 *               sem bg  px=12px py=8px  radius-sm=8px
 *               label: Nunito Medium 14px  rgba(13,13,13,0.4)
 *               icon:  24px  (opaco)
 *
 *   Item ativo:
 *               bg=pure-neutral/white (#fcfcfc)
 *               border=1px #a9a5a2
 *               shadow-sm (duplo)  radius-sm=8px
 *               label: Nunito SemiBold 14px  #3a3836
 *               badge "(1)": Nunito Medium 12px  rgba(13,13,13,0.4)
 *               icon: 24px  (cheio)
 *
 * Uso:
 *   <SegmentedControl
 *     items={[
 *       { value: 'dia',    label: 'Dia',    icon: <CalendarIcon size={20}/> },
 *       { value: 'semana', label: 'Semana', badge: '3' },
 *       { value: 'mes',    label: 'Mês' },
 *     ]}
 *     value="dia"
 *     onValueChange={setTab}
 *   />
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface SegmentedItem {
  value:   string;
  label:   string;
  /** Ícone ReactNode (24px recomendado) */
  icon?:   React.ReactNode;
  /** Badge numérico exibido só no item ativo ex: "(3)" */
  badge?:  string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  items:          SegmentedItem[];
  value?:         string;
  defaultValue?:  string;
  onValueChange?: (value: string) => void;
  className?:     string;
}

export function SegmentedControl({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
}: SegmentedControlProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value ?? '');
  const active = isControlled ? value! : internal;

  const handleSelect = (item: SegmentedItem) => {
    if (item.disabled || item.value === active) return;
    if (!isControlled) setInternal(item.value);
    onValueChange?.(item.value);
  };

  return (
    <div
      role="tablist"
      aria-label="Segmented Control"
      className={cn(
        'flex items-center gap-[8px] p-[6px] rounded-[12px]',
        'bg-[#e2e0df]',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === active;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => handleSelect(item)}
            className={cn(
              // Base
              'flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px]',
              'transition-all duration-150 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[rgba(139,94,150,0.3)]',
              'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
              // Ativo
              isActive && [
                'bg-[#fcfcfc]',
                'border border-[#a9a5a2]',
                'shadow-[0px_1px_3px_0px_rgba(13,13,13,0.04),0px_1px_2px_0px_rgba(13,13,13,0.04)]',
              ],
              // Inativo
              !isActive && 'bg-transparent border-transparent',
            )}
          >
            {/* Ícone (24px) */}
            {item.icon && (
              <span
                className={cn(
                  'shrink-0 size-6 flex items-center justify-center',
                  isActive ? 'opacity-100' : 'opacity-40',
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
            )}

            {/* Label */}
            <span
              className={cn(
                "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] text-[14px] leading-[1.5] whitespace-nowrap",
                isActive
                  ? 'font-[600] text-[#3a3836]'
                  : 'font-[500] text-[rgba(13,13,13,0.4)]',
              )}
            >
              {item.label}
            </span>

            {/* Badge — só aparece no item ativo quando fornecido */}
            {isActive && item.badge && (
              <span
                className={cn(
                  "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)]",
                  'font-[500] text-[12px] leading-[1.5] whitespace-nowrap',
                  'text-[rgba(13,13,13,0.4)]',
                )}
              >
                ({item.badge})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
