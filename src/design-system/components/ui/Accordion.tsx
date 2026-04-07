/**
 * NINHO DESIGN SYSTEM — Accordion + AccordionGroup
 * Node Figma: 2239:7257 | Nitro™ Core v3.0
 *
 * Tokens (get_variable_defs confirmado):
 *   Outline Default:  bg=#f8f7f7  border-bottom=#d8b9df  px=12px py=20px gap=12px shadow-xs
 *   Outline Hover:    bg=#faf3fc  border-bottom=#c59ad0
 *   Outline Expanded: bg=#f8f7f7  border-bottom=#d8b9df
 *   Rounded Default:  bg=#f8f7f7  border=1px #d8b9df  radius=6px  px=16px py=20px shadow-xs
 *   Rounded Hover:    bg=#faf3fc  border=1px #c59ad0
 *   Rounded Expanded: bg=#f8f7f7  border=1px #d8b9df
 *   Título:    Nunito Medium 16px  #3a3836
 *   Descrição: Nunito Regular 14px #524f4c
 *   Ícone trailing: + (collapsed) / – (expanded)  24px
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export type AccordionVariant = 'outline' | 'rounded';

export interface AccordionItem {
  value:       string;
  title:       string;
  description: string;
  icon?:       React.ReactNode;
}

export interface AccordionProps {
  title:            string;
  description:      string;
  icon?:            React.ReactNode;
  variant?:         AccordionVariant;
  expanded?:        boolean;
  defaultExpanded?: boolean;
  onToggle?:        (expanded: boolean) => void;
  className?:       string;
}

export interface AccordionGroupProps {
  items:     AccordionItem[];
  variant?:  AccordionVariant;
  multiple?: boolean;
  className?: string;
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function Accordion({ title, description, icon, variant = 'outline', expanded, defaultExpanded = false, onToggle, className }: AccordionProps) {
  const isControlled = expanded !== undefined;
  const [internal, setInternal] = useState(defaultExpanded);
  const [hovered,  setHovered]  = useState(false);
  const isExpanded = isControlled ? expanded! : internal;

  const handleToggle = () => {
    if (!isControlled) setInternal(p => !p);
    onToggle?.(!isExpanded);
  };

  const isOutline = variant === 'outline';
  const isRounded = variant === 'rounded';

  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      onClick={handleToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex items-start w-full cursor-pointer gap-[12px]',
        'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,94,150,0.3)]',
        'transition-colors duration-150 text-left',
        isOutline && ['px-[12px] py-[20px]',
          isExpanded ? 'bg-[#f8f7f7] border-b border-[#d8b9df]'
          : hovered   ? 'bg-[#faf3fc] border-b border-[#c59ad0]'
                      : 'bg-[#f8f7f7] border-b border-[#d8b9df]'],
        isRounded && ['px-[16px] py-[20px] rounded-[6px]',
          isExpanded ? 'bg-[#f8f7f7] border border-[#d8b9df]'
          : hovered   ? 'bg-[#faf3fc] border border-[#c59ad0]'
                      : 'bg-[#f8f7f7] border border-[#d8b9df]'],
        className,
      )}
    >
      {icon && <span className="shrink-0 size-6 flex items-center justify-center" aria-hidden="true">{icon}</span>}

      <div className="flex-1 min-w-0 flex flex-col gap-[8px] items-start">
        <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[16px] leading-[1.5] whitespace-nowrap text-[#3a3836]">
          {title}
        </span>
        {isExpanded && (
          <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[14px] leading-[1.5] text-[#524f4c] w-full">
            {description}
          </span>
        )}
      </div>

      <span className="shrink-0 size-6 flex items-center justify-center mt-[2px]">
        {isExpanded ? <MinusIcon /> : <PlusIcon />}
      </span>
    </button>
  );
}

export function AccordionGroup({ items, variant = 'outline', multiple = false, className }: AccordionGroupProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggle = (value: string) => {
    if (multiple) {
      setOpenItems(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    } else {
      setOpenItems(prev => prev.includes(value) ? [] : [value]);
    }
  };

  return (
    <div className={cn('flex flex-col', variant === 'rounded' ? 'gap-[8px]' : '', className)}>
      {items.map(item => (
        <Accordion key={item.value} title={item.title} description={item.description}
          icon={item.icon} variant={variant}
          expanded={openItems.includes(item.value)}
          onToggle={() => toggle(item.value)} />
      ))}
    </div>
  );
}
