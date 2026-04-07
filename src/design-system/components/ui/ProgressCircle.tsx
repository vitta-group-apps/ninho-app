/**
 * NINHO DESIGN SYSTEM — ProgressCircle
 * Node Figma: 2732:1493 | Nitro™ Core v3.0
 *
 * Card de status com círculo SVG de 32px.
 * Fill: mauve/400 (#8B5E96) — token confirmado no Figma Dev Mode.
 * Track: #e2e0df
 * Layout: horizontal | vertical | none
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type ProgressCircleLayout = 'horizontal' | 'vertical' | 'none';

export interface ProgressCircleProps {
  value:        number;
  layout?:      ProgressCircleLayout;
  label?:       string;
  optional?:    boolean;
  hint?:        string;
  showClose?:   boolean;
  onClose?:     () => void;
  className?:   string;
}

const CIRCLE_SIZE  = 32;
const STROKE_WIDTH = 3;
const FILL         = '#8B5E96';  // mauve/400
const TRACK        = '#e2e0df';  // neutral/bg-subtle_enabled

function CircleSVG({ value }: { value: number }) {
  const v    = Math.min(100, Math.max(0, value));
  const r    = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (v / 100) * circ;
  const c    = CIRCLE_SIZE / 2;
  return (
    <div className="relative shrink-0" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
      <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
        role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={TRACK} strokeWidth={STROKE_WIDTH} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={FILL} strokeWidth={STROKE_WIDTH}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          transform={`rotate(-90 ${c} ${c})`} style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
      </svg>
      <div className="absolute" style={{ inset: '12.5%' }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" aria-hidden="true">
          {v >= 100
            ? <path d="M5 12l5 5 9-9" stroke={FILL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            : <circle cx="12" cy="12" r="3" fill={FILL}/>
          }
        </svg>
      </div>
    </div>
  );
}

function CloseBtn({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Fechar"
      className="shrink-0 flex items-center justify-center size-6 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5E96]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="#3a3836" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

export function ProgressCircle({ value, layout = 'horizontal', label, optional = false, hint, showClose = true, onClose, className }: ProgressCircleProps) {

  const text = (
    <div className={cn('flex flex-col shrink-0 w-[105px] gap-[4px]', layout === 'vertical' ? 'items-center' : 'items-start')}>
      {label && layout !== 'none' && (
        <div className="flex items-center gap-[4px] whitespace-nowrap">
          <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/medium,500)] text-[length:var(--font-sizes\/text\/md,14px)] leading-[1.5] text-[color:var(--neutral\/foreground\/fg-high-contrast,#3a3836)]">{label}</span>
          {optional && <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[length:var(--font-sizes\/text\/md,14px)] leading-[1.5] text-[color:var(--neutral\/foreground\/fg-low-contrast,#524f4c)]">(optional)</span>}
        </div>
      )}
      {hint && <span className="font-[family-name:var(--font-family\/text,'Nunito',sans-serif)] font-[var(--font-weight\/regular,400)] text-[length:var(--font-sizes\/text\/sm,12px)] leading-[1.5] whitespace-nowrap text-[color:var(--neutral\/foreground\/fg-low-contrast,#524f4c)]">{hint}</span>}
    </div>
  );

  if (layout === 'vertical') {
    return (
      <div className={cn('flex flex-col items-start gap-[16px]', className)}>
        <div className="flex flex-col items-center gap-[16px]">
          <CircleSVG value={value} />
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between w-[300px]', className)}>
      <div className="flex items-center gap-[16px]">
        <CircleSVG value={value} />
        {text}
      </div>
      {showClose && <CloseBtn onClick={onClose} />}
    </div>
  );
}
