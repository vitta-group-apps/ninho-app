/**
 * NINHO DS — Text
 * Componente tipográfico — Quicksand (heading) + Nunito (body).
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type TextVariant =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5'
  | 'body-lg-regular' | 'body-lg-medium' | 'body-lg-semibold'
  | 'body-md-regular' | 'body-md-medium' | 'body-md-semibold'
  | 'caption-regular' | 'caption-medium';

export type TextColor =
  | 'default' | 'secondary' | 'accent' | 'success'
  | 'warning' | 'error' | 'info' | 'on-tint' | 'disabled';

export interface TextProps {
  variant?:  TextVariant;
  color?:    TextColor;
  as?:       keyof JSX.IntrinsicElements;
  children:  React.ReactNode;
  className?: string;
}

const variantClasses: Record<TextVariant, string> = {
  h1:               'font-heading font-bold text-heading-md leading-tight',
  h2:               'font-heading font-bold text-heading-sm leading-tight',
  h3:               'font-heading font-bold text-heading-xs leading-tight',
  h4:               'font-heading font-bold text-heading-xxs leading-tight',
  h5:               'font-heading font-bold text-heading-xs leading-tight',
  'body-lg-regular':  'font-body font-regular text-text-lg',
  'body-lg-medium':   'font-body font-medium  text-text-lg',
  'body-lg-semibold': 'font-body font-semibold text-text-lg',
  'body-md-regular':  'font-body font-regular text-text-md',
  'body-md-medium':   'font-body font-medium  text-text-md',
  'body-md-semibold': 'font-body font-semibold text-text-md',
  'caption-regular':  'font-body font-regular text-text-sm',
  'caption-medium':   'font-body font-medium  text-text-sm',
};

const colorClasses: Record<TextColor, string> = {
  default:   'text-ds-neutral-fg-strong',
  secondary: 'text-ds-neutral-fg',
  accent:    'text-ds-accent-fg',
  success:   'text-ds-success-fg',
  warning:   'text-ds-warning-fg',
  error:     'text-ds-error-fg',
  info:      'text-ds-info-fg',
  'on-tint': 'text-ds-on-tint-white',
  disabled:  'text-ds-neutral-fg',
};

const defaultTag: Partial<Record<TextVariant, keyof JSX.IntrinsicElements>> = {
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5',
};

export function Text({
  variant  = 'body-md-regular',
  color    = 'default',
  as,
  children,
  className,
}: TextProps) {
  const Tag = (as ?? defaultTag[variant] ?? 'p') as keyof JSX.IntrinsicElements;

  return (
    <Tag className={cn(variantClasses[variant], colorClasses[color], className)}>
      {children}
    </Tag>
  );
}
