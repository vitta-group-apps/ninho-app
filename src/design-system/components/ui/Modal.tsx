/**
 * NINHO DESIGN SYSTEM — Modal
 * Node Figma: 5982:13142 | Nitro™ Core v3.0
 *
 * Tokens (get_variable_defs confirmado):
 *   container: bg=#fcfcfc border=1px #a9a5a2 radius-lg=12px shadow-sm
 *   title:  Nunito SemiBold 18px #3a3836 line-height=1.4
 *   desc:   Nunito Medium 14px #524f4c
 *   close:  p=6px radius=6px shadow-xs icone=16px
 *   image:  aspect=500:208 rounded-tl/tr=8px (title-in-top)
 *   content title-in-top:   px=32px py=20px gap=8px
 *   content picture-in-top: p=32px
 *   divider: border-bottom #a9a5a2
 *   dock:   p=16px botoes px=8px py=8px radius=6px
 *   primario: bg=#8b5e96 hover=#6e2880 text=#fcfcfc SemiBold 14px
 *   secundario: bg=#f8f7f7 border=#a9a5a2 text=#3a3836 SemiBold 14px
 *
 * title-in-top: imagem topo -> X absoluto -> title+desc -> divider -> dock
 * picture-in-top: header(title+X) -> imagem -> desc -> divider -> dock
 * Portal: renderiza em document.body
 * Overlay: rgba(13,13,13,0.4) — fecha ao clicar fora e Escape
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export type ModalType = 'title-in-top' | 'picture-in-top';

export interface ModalAction {
  label:    string;
  onClick?: () => void;
  icon?:    React.ReactNode;
}

export interface ModalProps {
  open:             boolean;
  onClose:          () => void;
  title?:           string;
  description?:     string | React.ReactNode;
  type?:            ModalType;
  image?:           string | React.ReactNode;
  primaryAction?:   ModalAction;
  secondaryAction?: ModalAction;
  badgeLabel?:      string;
  closeOnOverlay?:  boolean;
  closeOnEscape?:   boolean;
  className?:       string;
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronRight({ color = '#3a3836' }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const DESC_CLASS = "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[14px] leading-[1.5] text-[#524f4c] w-full";
const TITLE_CLASS = "font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/semi-bold,600)] text-[18px] leading-[1.4] text-[#3a3836]";

export function Modal({
  open, onClose, title, description,
  type = 'title-in-top', image,
  primaryAction, secondaryAction, badgeLabel,
  closeOnOverlay = true, closeOnEscape = true, className,
}: ModalProps) {

  useEffect(() => {
    if (!closeOnEscape) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const isTitleInTop   = type === 'title-in-top';
  const isPictureInTop = type === 'picture-in-top';
  const hasBottomDock  = !!(primaryAction || secondaryAction || badgeLabel);

  const heroImage = image
    ? typeof image === 'string'
      ? <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none"/>
      : image
    : null;

  const closeBtn = (extra?: string) => (
    <button type="button" onClick={onClose} aria-label="Fechar"
      className={cn('flex items-center justify-center p-[6px] rounded-[6px] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)] hover:bg-[#f8f7f7] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,94,150,0.3)]', extra)}>
      <CloseIcon />
    </button>
  );

  const descEl = description && (
    <div className={DESC_CLASS}>
      {typeof description === 'string' ? <p className="whitespace-pre-wrap">{description}</p> : description}
    </div>
  );

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(13,13,13,0.4)' }}
      onClick={(e) => { if (closeOnOverlay && e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={cn(
        'relative flex flex-col items-start overflow-hidden',
        'bg-[#fcfcfc] border border-[#a9a5a2] rounded-[12px]',
        'shadow-[0px_1px_3px_0px_rgba(13,13,13,0.04),0px_1px_2px_0px_rgba(13,13,13,0.04)]',
        'w-full max-w-[500px] max-h-[90vh] overflow-y-auto',
        className,
      )}>

        {/* ── Title In Top ── */}
        {isTitleInTop && <>
          {heroImage && (
            <div className="relative shrink-0 w-full" style={{ aspectRatio: '500/208' }}>
              <div className="rounded-tl-[8px] rounded-tr-[8px] overflow-hidden absolute inset-0">{heroImage}</div>
            </div>
          )}
          {/* X absoluto no canto superior direito */}
          <div className="absolute top-0 right-0 flex items-center justify-end px-[16px] py-[8px] w-full pointer-events-none">
            {closeBtn('pointer-events-auto bg-white/80 backdrop-blur-sm')}
          </div>
          <div className="flex items-center justify-center px-[32px] py-[20px] w-full shrink-0">
            <div className="flex flex-1 flex-col gap-[8px] items-start min-w-0">
              {title && <h2 id="modal-title" className={cn(TITLE_CLASS, 'w-full')}>{title}</h2>}
              {descEl}
            </div>
          </div>
        </>}

        {/* ── Picture In Top ── */}
        {isPictureInTop && <>
          <div className="flex items-center justify-between p-[16px] w-full shrink-0">
            {title && <h2 id="modal-title" className={cn(TITLE_CLASS, 'whitespace-nowrap')}>{title}</h2>}
            {closeBtn()}
          </div>
          {heroImage && (
            <div className="relative shrink-0 w-full overflow-hidden" style={{ aspectRatio: '500/208' }}>{heroImage}</div>
          )}
          <div className="flex items-center justify-center p-[32px] w-full shrink-0">
            <div className="flex flex-1 flex-col gap-[8px] items-start min-w-0">{descEl}</div>
          </div>
        </>}

        {/* Divider */}
        {hasBottomDock && <div className="w-full shrink-0 border-b border-[#a9a5a2]" />}

        {/* Bottom Dock */}
        {hasBottomDock && (
          <div className="flex items-center justify-end overflow-hidden p-[16px] w-full shrink-0 bg-[#fcfcfc]">
            <div className="flex flex-1 items-center justify-between min-w-0">
              {badgeLabel ? (
                <div className="flex items-center bg-[#f8f7f7] px-[2px] py-[4px] rounded-[6px] shrink-0">
                  <div className="flex items-center justify-center h-5 px-[4px]">
                    <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[12px] leading-[1.5] whitespace-nowrap text-[#524f4c]">{badgeLabel}</span>
                  </div>
                </div>
              ) : <div />}
              <div className="flex items-center gap-[16px] shrink-0">
                {secondaryAction && (
                  <button type="button" onClick={secondaryAction.onClick}
                    className="flex items-center gap-[4px] overflow-hidden px-[8px] py-[8px] rounded-[6px] bg-[#f8f7f7] border border-[#a9a5a2] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)] hover:bg-[#ceccca] transition-colors cursor-pointer focus-visible:outline-none">
                    <span className="flex items-center px-[4px]">
                      <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/semi-bold,600)] text-[14px] leading-[1.5] whitespace-nowrap text-[#3a3836]">{secondaryAction.label}</span>
                    </span>
                    <span className="shrink-0 size-6 flex items-center">{secondaryAction.icon ?? <ChevronRight />}</span>
                  </button>
                )}
                {primaryAction && (
                  <button type="button" onClick={primaryAction.onClick}
                    className="flex items-center gap-[4px] overflow-hidden px-[8px] py-[8px] rounded-[6px] bg-[#8b5e96] shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)] hover:bg-[#6e2880] transition-colors cursor-pointer focus-visible:outline-none">
                    <span className="flex items-center px-[4px]">
                      <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[600] text-[14px] leading-[1.5] whitespace-nowrap text-[#fcfcfc]">{primaryAction.label}</span>
                    </span>
                    <span className="shrink-0 size-6 flex items-center">{primaryAction.icon ?? <ChevronRight color="#fcfcfc" />}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
