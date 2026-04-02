/**
 * NINHO DESIGN SYSTEM — Breadcrumbs
 * Node Figma: 2273:8473 | Nitro™ Core v3.0
 *
 * Tokens (get_variable_defs confirmado):
 *   item default:  Nunito Medium 14px  fg-low-contrast  (#524f4c)
 *   item hover:    Nunito Medium 14px  fg-high-contrast (#3a3836)  underline
 *   item selected: Nunito Medium 14px  fg-high-contrast (#3a3836)  sem arrow
 *   separador Arrow: chevron 24px
 *   separador Slash: / 24px
 *   gap geral: 8px | gap icon-label: 8px | gap label-arrow: 4px
 *   home: ícone 24px + label "Home"
 *
 * Uso:
 *   <Breadcrumbs
 *     items={[
 *       { label: 'Home', href: '/' },
 *       { label: 'Saúde', href: '/saude' },
 *       { label: 'Vacinas' },       // ← sem href = current page
 *     ]}
 *     separator="arrow"
 *   />
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type BreadcrumbsSeparator = 'arrow' | 'slash';

export interface BreadcrumbItem {
  label:   string;
  href?:   string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items:       BreadcrumbItem[];
  separator?:  BreadcrumbsSeparator;
  className?:  string;
}

// ── Ícone Home SVG inline ─────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke="#524f4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10"
        stroke="#524f4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Separadores SVG inline ────────────────────────────────────────────────
function ArrowSeparator() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M9 18l6-6-6-6" stroke="#a9a5a2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SlashSeparator() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 overflow-hidden">
      <path d="M16 4L8 20" stroke="#a9a5a2" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Estilos de texto ──────────────────────────────────────────────────────
const TEXT_BASE = "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[14px] leading-[1.5] whitespace-nowrap";
const TEXT_DEFAULT  = 'text-[#524f4c]';
const TEXT_ACTIVE   = 'text-[#3a3836]';
const TEXT_SELECTED = 'text-[#3a3836]';

// ── Componente principal ──────────────────────────────────────────────────
export function Breadcrumbs({
  items,
  separator = 'arrow',
  className,
}: BreadcrumbsProps) {
  const Separator = separator === 'arrow' ? ArrowSeparator : SlashSeparator;
  const isFirst = (idx: number) => idx === 0;
  const isLast  = (idx: number) => idx === items.length - 1;

  return (
    <nav aria-label="Breadcrumb">
      <ol className={cn('flex items-center gap-[8px]', className)}>
        {items.map((item, idx) => {
          const last    = isLast(idx);
          const first   = isFirst(idx);
          const hasLink = !!item.href || !!item.onClick;

          return (
            <li key={idx} className="flex items-center gap-[8px] shrink-0">
              {/* Item */}
              {last || !hasLink ? (
                // ── Página atual (selected) ou sem link ───────────────────
                <span
                  className={cn(
                    'flex items-center gap-[4px]',
                    first ? 'gap-[8px]' : 'gap-[4px]',
                  )}
                  aria-current={last ? 'page' : undefined}
                >
                  {first && <HomeIcon />}
                  <span className={cn(TEXT_BASE, last ? TEXT_SELECTED : TEXT_DEFAULT)}>
                    {item.label}
                  </span>
                </span>
              ) : (
                // ── Link clicável ─────────────────────────────────────────
                <button
                  type="button"
                  onClick={item.onClick ?? (() => item.href && (window.location.href = item.href))}
                  className={cn(
                    'flex items-center cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,94,150,0.3)] rounded',
                    'group',
                    first ? 'gap-[8px]' : 'gap-[4px]',
                  )}
                >
                  {first && <HomeIcon />}
                  <span className={cn(
                    TEXT_BASE, TEXT_ACTIVE,
                    'group-hover:underline decoration-solid underline-offset-2',
                  )}>
                    {item.label}
                  </span>
                </button>
              )}

              {/* Separador — só aparece se não for o último */}
              {!last && (
                <span aria-hidden="true" className="shrink-0">
                  <Separator />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
