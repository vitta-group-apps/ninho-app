/**
 * NINHO DS — Divider
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface DividerProps {
  label?:     string;
  vertical?:  boolean;
  className?: string;
}

export function Divider({ label, vertical = false, className }: DividerProps) {
  if (vertical) {
    return <div className={cn('w-px self-stretch bg-neutral-border', className)} />;
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-[var(--gap-sm)]', className)}>
        <div className="flex-1 h-px bg-neutral-border" />
        <span className="font-body text-text-sm text-neutral-fg shrink-0">{label}</span>
        <div className="flex-1 h-px bg-neutral-border" />
      </div>
    );
  }

  return <div className={cn('w-full h-px bg-neutral-border', className)} />;
}
