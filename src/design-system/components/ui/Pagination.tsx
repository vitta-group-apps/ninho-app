/**
 * NINHO DESIGN SYSTEM — Pagination
 * Node Figma: 3061:6835 | Nitro™ Core v3.0
 *
 * Tokens (get_variable_defs confirmado):
 *   Página default:  bg=#f8f7f7  border=1px #a9a5a2  size=40px  radius=6px
 *   Página ativa:    bg=mauve/500 (#c59ad0)  text=#fcfcfc
 *   Ellipsis (...):  bg=#f8f7f7  border=1px #a9a5a2  não clicável
 *   Número: Nunito Medium 16px  #3a3836
 *   Botões Prev/Next: bg=#f8f7f7 border=1px #a9a5a2 shadow-xs
 *     label: Nunito SemiBold 14px  #3a3836  gap=4px
 *   Ícones arrow: 24px
 *   gap entre itens: 8px
 *
 * Tipos:
 *   arrow:   ← [1] [2] [...] [4] [5] →   (ícones de seta)
 *   buttons: [← Previous] [nums] [Next →] (botões com texto)
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type PaginationVariant = 'arrow' | 'buttons';

export interface PaginationProps {
  /** Página atual (1-based) */
  currentPage:     number;
  /** Total de páginas */
  totalPages:      number;
  /** Callback ao mudar página */
  onPageChange:    (page: number) => void;
  /** arrow = ícones | buttons = "Previous/Next" com texto */
  variant?:        PaginationVariant;
  /** Número de páginas visíveis ao redor da ativa */
  siblingCount?:   number;
  className?:      string;
}

// ── Ícones SVG inline ─────────────────────────────────────────────────────
function ArrowLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Gerar range de páginas com ellipsis ───────────────────────────────────
function getPageRange(current: number, total: number, siblings: number): (number | '...')[] {
  const totalVisible = siblings * 2 + 5; // siblings + current + 2 edges + 2 ellipsis

  if (total <= totalVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling  = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);
  const showLeftDots  = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + siblings * 2 }, (_, i) => i + 1);
    return [...leftRange, '...', total];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from({ length: 3 + siblings * 2 }, (_, i) => total - (3 + siblings * 2) + i + 1);
    return [1, '...', ...rightRange];
  }

  const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
  return [1, '...', ...middleRange, '...', total];
}

// ── Classes base dos botões de número ─────────────────────────────────────
const PAGE_BTN_BASE = 'flex flex-col items-center justify-center overflow-hidden rounded-[6px] size-[40px] shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(197,154,208,0.5)]';
const PAGE_BTN_DEFAULT = 'bg-[#f8f7f7] border border-[#a9a5a2] text-[#3a3836] hover:bg-[#eeedec] cursor-pointer';
const PAGE_BTN_ACTIVE  = 'bg-[#c59ad0] text-[#fcfcfc] cursor-default';
const PAGE_BTN_DOTS    = 'bg-[#f8f7f7] border border-[#a9a5a2] text-[#3a3836] cursor-default';
const NUM_FONT = "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[16px] leading-[1.5] whitespace-nowrap";

// ── Componente principal ──────────────────────────────────────────────────
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant      = 'arrow',
  siblingCount = 1,
  className,
}: PaginationProps) {
  const pages = getPageRange(currentPage, totalPages, siblingCount);

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  // ── Botões de número ────────────────────────────────────────────────────
  const pageNumbers = (
    <div className="flex items-center gap-[8px] shrink-0">
      {pages.map((page, idx) => {
        if (page === '...') {
          return (
            <div key={`dots-${idx}`} className={cn(PAGE_BTN_BASE, PAGE_BTN_DOTS)} aria-hidden="true">
              <span className={NUM_FONT}>...</span>
            </div>
          );
        }
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => goTo(page as number)}
            aria-label={`Página ${page}`}
            aria-current={isActive ? 'page' : undefined}
            disabled={isActive}
            className={cn(PAGE_BTN_BASE, isActive ? PAGE_BTN_ACTIVE : PAGE_BTN_DEFAULT)}
          >
            <span className={NUM_FONT}>{page}</span>
          </button>
        );
      })}
    </div>
  );

  // ── Variante Arrow ──────────────────────────────────────────────────────
  if (variant === 'arrow') {
    const navBtnClass = cn(
      'flex items-center justify-center overflow-hidden p-[8px] rounded-[6px] shrink-0',
      'bg-[#f8f7f7] border border-[#a9a5a2]',
      'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
      'transition-colors duration-150 cursor-pointer',
      'hover:bg-[#eeedec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(197,154,208,0.5)]',
      'disabled:opacity-40 disabled:cursor-not-allowed',
    );

    return (
      <nav aria-label="Paginação" className={cn('flex items-center justify-between', className)}>
        <button type="button" onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1} aria-label="Página anterior" className={navBtnClass}>
          <ArrowLeft />
        </button>
        {pageNumbers}
        <button type="button" onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages} aria-label="Próxima página" className={navBtnClass}>
          <ArrowRight />
        </button>
      </nav>
    );
  }

  // ── Variante Buttons ────────────────────────────────────────────────────
  const btnClass = cn(
    'flex items-center gap-[4px] px-[8px] py-[8px] rounded-[6px] shrink-0',
    'bg-[#f8f7f7] border border-[#a9a5a2]',
    'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
    'transition-colors duration-150 cursor-pointer',
    'hover:bg-[#eeedec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(197,154,208,0.5)]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  );
  const btnLabel = "flex items-center justify-center px-[4px] font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/semi-bold,600)] text-[14px] leading-[1.5] text-[#3a3836] whitespace-nowrap";

  return (
    <nav aria-label="Paginação" className={cn('flex items-center justify-between', className)}>
      <button type="button" onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1} aria-label="Página anterior" className={btnClass}>
        <ChevronLeft />
        <span className={btnLabel}>Previous</span>
      </button>
      {pageNumbers}
      <button type="button" onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages} aria-label="Próxima página" className={btnClass}>
        <span className={btnLabel}>Next</span>
        <ChevronRight />
      </button>
    </nav>
  );
}
