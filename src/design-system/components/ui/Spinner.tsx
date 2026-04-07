/**
 * NINHO DESIGN SYSTEM — Spinner (Round + Dots)
 * Nodes Figma: 348:1025 (Round) | 2537:12235 (Dots)
 * Nitro™ Core v3.0
 *
 * Token: accent/foreground/fg-low-contrast = #672079
 *
 * SpinnerRound: arco circular SVG com animate-spin
 * SpinnerDots:  8 traços radiais com steps(8) — fiel ao Figma
 * Tamanhos: sm=16px | md=20px | lg=24px
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZES: Record<SpinnerSize, number> = { sm: 16, md: 20, lg: 24 };
const COLOR = '#672079'; // accent/foreground/fg-low-contrast

// ── SpinnerRound ──────────────────────────────────────────────────────────
export interface SpinnerRoundProps {
  size?:      SpinnerSize;
  className?: string;
  label?:     string;
}

export function SpinnerRound({ size = 'md', className, label = 'Carregando…' }: SpinnerRoundProps) {
  const px          = SIZES[size];
  const sw          = Math.max(1.5, px * 0.1);
  const r           = (px - sw) / 2;
  const circ        = 2 * Math.PI * r;
  const c           = px / 2;

  return (
    <svg
      width={px} height={px} viewBox={`0 0 ${px} ${px}`}
      fill="none" role="status" aria-label={label}
      className={cn('animate-spin', className)}
      style={{ animationDuration: '0.75s', animationTimingFunction: 'linear' }}
    >
      {/* Track */}
      <circle cx={c} cy={c} r={r} stroke={COLOR} strokeOpacity="0.15" strokeWidth={sw} />
      {/* Arco — 75% do círculo */}
      <circle
        cx={c} cy={c} r={r}
        stroke={COLOR} strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * 0.25}
        transform={`rotate(-90 ${c} ${c})`}
      />
    </svg>
  );
}

// ── SpinnerDots ───────────────────────────────────────────────────────────
export interface SpinnerDotsProps {
  size?:      SpinnerSize;
  className?: string;
  label?:     string;
}

// 8 traços com opacidade decrescente — traço 0 = head (1.0) até traço 7 (0.125)
const OPACITIES = [1, 0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125];

export function SpinnerDots({ size = 'md', className, label = 'Carregando…' }: SpinnerDotsProps) {
  const px     = SIZES[size];
  const c      = px / 2;
  const len    = px * 0.275;
  const sw     = Math.max(1, px * 0.08);
  const offset = px * 0.19;

  return (
    <svg
      width={px} height={px} viewBox={`0 0 ${px} ${px}`}
      fill="none" role="status" aria-label={label}
      className={cn(className)}
      style={{ animation: 'ninho-spin-dots 0.8s steps(8, end) infinite' }}
    >
      <style>{`@keyframes ninho-spin-dots{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      {OPACITIES.map((opacity, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x1 = c + offset * Math.sin(angle);
        const y1 = c - offset * Math.cos(angle);
        const x2 = c + (offset + len) * Math.sin(angle);
        const y2 = c - (offset + len) * Math.cos(angle);
        return (
          <line key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={COLOR} strokeOpacity={opacity}
            strokeWidth={sw} strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
