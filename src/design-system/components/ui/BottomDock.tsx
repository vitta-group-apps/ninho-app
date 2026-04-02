/**
 * NINHO DESIGN SYSTEM — BottomDock
 * Node Figma: 5520:175 | Nitro™ Core v3.0
 *
 * Barra de ação fixa no rodapé do app.
 * [Badge/paginação ←→] ........... [Secundário] [Primário →]
 *
 * Tokens confirmados via Figma variables:
 *   container:   pure-neutral/white (#fcfcfc)  padding-lg (16px)
 *   badge pill:  bg-subtle_01 (#f8f7f7)  px=2px py=4px  radius-xs
 *   secundário:  bg-subtle_01 + border #a9a5a2 + shadow-xs  SemiBold 14px
 *   primário:    accent/bg-tint_01 (#8b5e96) + shadow-xs  SemiBold 14px branco
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface BottomDockAction {
  label:     string;
  onClick?:  () => void;
  icon?:     React.ReactNode;
  disabled?: boolean;
}

export interface BottomDockBadge {
  label:         string;
  onPrev?:       () => void;
  onNext?:       () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}

export interface BottomDockProps {
  primaryAction:    BottomDockAction;
  secondaryAction?: BottomDockAction;
  badge?:           BottomDockBadge;
  className?:       string;
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function BottomDock({ primaryAction, secondaryAction, badge, className }: BottomDockProps) {
  return (
    <div className={cn(
      'flex items-center justify-end overflow-hidden w-full',
      'bg-[var(--pure-neutral\\/white,#fcfcfc)]',
      'p-[var(--padding-lg,16px)]',
      className,
    )}>
      <div className="flex flex-1 items-center justify-between min-w-0">

        {/* Badge / Paginação */}
        {badge ? (
          <div className="flex items-center bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)] px-[2px] py-[4px] rounded-[var(--radius-xs,6px)] shrink-0">
            <button type="button" onClick={badge.onPrev} disabled={badge.prevDisabled} aria-label="Anterior"
              className="flex items-center justify-center size-5 text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)] disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e96] rounded">
              <ChevronLeft />
            </button>
            <div className="flex items-center justify-center h-5 px-[4px]">
              <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[length:var(--font-sizes\/text\/sm,12px)] leading-[1.5] whitespace-nowrap text-[color:var(--neutral\/foreground\/fg-low-contrast,#524f4c)]">
                {badge.label}
              </span>
            </div>
            <button type="button" onClick={badge.onNext} disabled={badge.nextDisabled} aria-label="Próximo"
              className="flex items-center justify-center size-5 text-[color:var(--neutral\\/foreground\\/fg-low-contrast,#524f4c)] disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e96] rounded">
              <ChevronRight />
            </button>
          </div>
        ) : <div />}

        {/* Ações */}
        <div className="flex items-center gap-[16px] shrink-0">

          {secondaryAction && (
            <button type="button" onClick={secondaryAction.onClick} disabled={secondaryAction.disabled}
              className={cn(
                'flex items-center justify-center gap-[4px] overflow-hidden cursor-pointer transition-colors duration-150',
                'px-[var(--padding-sm,8px)] py-[var(--gap-sm,8px)]',
                'rounded-[var(--radius-xs,6px)]',
                'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
                'bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)]',
                'border border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)]',
                'text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]',
                'hover:bg-[var(--neutral\\/background\\/bg-subtle_hover,#ceccca)]',
                'focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}>
              <span className="flex items-center justify-center px-[4px]">
                <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/semi-bold,600)] text-[length:var(--font-sizes\/text\/md,14px)] leading-[1.5] whitespace-nowrap">
                  {secondaryAction.label}
                </span>
              </span>
              <span className="shrink-0 size-6 flex items-center" aria-hidden="true">
                {secondaryAction.icon ?? <ChevronRight />}
              </span>
            </button>
          )}

          <button type="button" onClick={primaryAction.onClick} disabled={primaryAction.disabled}
            className={cn(
              'flex items-center justify-center gap-[4px] overflow-hidden cursor-pointer transition-colors duration-150',
              'px-[var(--padding-sm,8px)] py-[var(--gap-sm,8px)]',
              'rounded-[var(--radius-xs,6px)]',
              'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
              'bg-[var(--accent\\/background\\/bg-tint_01,#8b5e96)]',
              'text-[color:var(--static-neutral\\/white,#fcfcfc)]',
              'hover:bg-[var(--accent\\/background\\/bg-tint_02,#6e2880)]',
              'focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_4px_rgba(103,32,121,0.32),0px_1px_2px_0px_rgba(13,13,13,0.04)]',
              'disabled:bg-[rgba(216,185,223,0.32)] disabled:text-[rgba(103,32,121,0.32)] disabled:shadow-none disabled:cursor-not-allowed',
            )}>
            <span className="flex items-center justify-center px-[4px]">
              <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/semi-bold,600)] text-[length:var(--font-sizes\/text\/md,14px)] leading-[1.5] whitespace-nowrap">
                {primaryAction.label}
              </span>
            </span>
            <span className="shrink-0 size-6 flex items-center" aria-hidden="true">
              {primaryAction.icon ?? <ChevronRight />}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
