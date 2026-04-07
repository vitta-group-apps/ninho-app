/**
 * NINHO DS — Avatar
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?:       string;
  alt?:       string;
  initials?:  string;
  size?:      AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { outer: string; text: string }> = {
  xs: { outer: 'h-6  w-6',  text: 'text-[9px]'  },
  sm: { outer: 'h-8  w-8',  text: 'text-[11px]' },
  md: { outer: 'h-10 w-10', text: 'text-text-sm' },
  lg: { outer: 'h-12 w-12', text: 'text-text-md' },
  xl: { outer: 'h-16 w-16', text: 'text-text-lg' },
};

export function Avatar({ src, alt = '', initials, size = 'md', className }: AvatarProps) {
  const { outer, text } = sizeClasses[size];

  return (
    <div className={cn(
      'rounded-full overflow-hidden shrink-0',
      'bg-ds-accent-subtle flex items-center justify-center',
      outer,
      className,
    )}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className={cn('font-body font-semibold text-ds-accent-fg', text)}>
          {(initials ?? '?').substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
