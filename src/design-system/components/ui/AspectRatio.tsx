/**
 * NINHO DESIGN SYSTEM — AspectRatio
 * Node Figma: 5520:191 | Nitro™ Core v3.0
 *
 * Proporções: 16:9 | 12:9 | 12:4 | 4:3 | 1:1
 * radius-sm = 8px
 * Suporta: src (string), children (ReactNode)
 */
import React from 'react';
import { cn } from '../../lib/utils';
export type AspectRatioProportion = '16:9' | '12:9' | '12:4' | '4:3' | '1:1';
export interface AspectRatioProps {
  proportion?: AspectRatioProportion;
  src?: string; alt?: string;
  children?: React.ReactNode; className?: string;
}
const RATIO: Record<AspectRatioProportion, string> = {
  '16:9': '16/9', '12:9': '500/208', '12:4': '500/166', '4:3': '4/3', '1:1': '1/1',
};
export function AspectRatio({ proportion = '16:9', src, alt = '', children, className }: AspectRatioProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-[8px] w-full', className)} style={{ aspectRatio: RATIO[proportion] }}>
      {src && <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover pointer-events-none"/>}
      {children}
    </div>
  );
}
