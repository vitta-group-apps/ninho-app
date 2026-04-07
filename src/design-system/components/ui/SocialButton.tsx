/**
 * NINHO DESIGN SYSTEM — SocialButton
 * Node Figma: 2859:4421 | Nitro™ Core v3.0
 *
 * Social: Google | LinkedIn | Apple | Facebook
 * Size:   lg (56px) | md (48px) | sm (40px)
 * State:  Default | Hover | Focus
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type SocialProvider = 'google' | 'linkedin' | 'apple' | 'facebook';
export type SocialButtonSize = 'lg' | 'md' | 'sm';

export interface SocialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider:      SocialProvider;
  label?:        string;
  showLabel?:    boolean;
  size?:         SocialButtonSize;
  fullWidth?:    boolean;
}

// ── Tokens por provider ────────────────────────────────────────────────────
// Google:   bg=neutral/bg-subtle_01 (#f8f7f7)  border=1.5px  texto=fg-high-contrast
//           hover: bg=neutral/bg-subtle_02 (#eeedec)
//           focus: ring=overlay-black/100 (rgba(13,13,13,0.12))
//
// LinkedIn: bg=#0f5bb6   hover=#0c4483   focus: ring=info-disabled/fg-disabled (rgba(23,52,70,0.32))
// Facebook: bg=#095bf8   hover=#0048cb   focus: ring=info-disabled/fg-disabled
// Apple:    bg=#0d0d0d   hover=#0d0d0d   focus: ring=overlay-black/100 (rgba(13,13,13,0.12))
// ──────────────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<SocialButtonSize, string> = {
  lg: 'h-14 px-[24px] py-[var(--padding-lg,16px)]',
  md: 'h-12 px-[var(--padding-xl,20px)] py-[var(--padding-md,12px)]',
  sm: 'h-10 px-[var(--padding-md,12px)] py-[var(--padding-sm,8px)]',
};

const FONT_SIZE: Record<SocialButtonSize, string> = {
  lg: 'text-[length:var(--font-sizes\\/text\\/lg,16px)]',
  md: 'text-[length:var(--font-sizes\\/text\\/md,14px)]',
  sm: 'text-[length:var(--font-sizes\\/text\\/md,14px)]',
};

const PROVIDER_STYLES: Record<SocialProvider, {
  base: string;
  hover: string;
  focus: string;
  textColor: string;
}> = {
  google: {
    base:      "bg-[var(--neutral\\/background\\/bg-subtle_01,#f8f7f7)] border-[1.5px] border-[var(--neutral\\/border\\/border-subtle_enabled,#a9a5a2)]",
    hover:     "hover:bg-[var(--neutral\\/background\\/bg-subtle_02,#eeedec)]",
    focus:     "focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    textColor: "text-[color:var(--neutral\\/foreground\\/fg-high-contrast,#3a3836)]",
  },
  linkedin: {
    base:      "bg-[#0f5bb6]",
    hover:     "hover:bg-[#0c4483]",
    focus:     "focus-visible:shadow-[0px_0px_0px_4px_var(--info-disabled\\/fg-disabled,rgba(23,52,70,0.32)),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    textColor: "text-[color:var(--static-neutral\\/white,#fcfcfc)]",
  },
  facebook: {
    base:      "bg-[#095bf8]",
    hover:     "hover:bg-[#0048cb]",
    focus:     "focus-visible:shadow-[0px_0px_0px_4px_var(--info-disabled\\/fg-disabled,rgba(23,52,70,0.32)),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    textColor: "text-[color:var(--static-neutral\\/white,#fcfcfc)]",
  },
  apple: {
    base:      "bg-[var(--pure-neutral\\/black,#0d0d0d)]",
    hover:     "hover:bg-[var(--pure-neutral\\/black,#0d0d0d)] hover:opacity-90",
    focus:     "focus-visible:shadow-[0px_0px_0px_4px_rgba(13,13,13,0.12),0px_1px_2px_0px_rgba(13,13,13,0.04)]",
    textColor: "text-[color:var(--pure-neutral\\/white,#fcfcfc)]",
  },
};

// Ícones SVG inline — não dependem de assets externos
function GoogleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M18.1 10.2c0-.63-.06-1.25-.16-1.84H10v3.48h4.54a3.88 3.88 0 0 1-1.68 2.55v2.12h2.72c1.59-1.46 2.52-3.62 2.52-6.31Z" fill="#4285F4"/>
      <path d="M10 18.5c2.28 0 4.19-.75 5.58-2.04l-2.72-2.12c-.75.5-1.72.8-2.86.8-2.2 0-4.06-1.49-4.73-3.48H2.46v2.19A8.5 8.5 0 0 0 10 18.5Z" fill="#34A853"/>
      <path d="M5.27 11.66A5.1 5.1 0 0 1 5 10c0-.58.1-1.14.27-1.66V6.15H2.46A8.5 8.5 0 0 0 1.5 10c0 1.37.33 2.67.96 3.85l2.81-2.19Z" fill="#FBBC05"/>
      <path d="M10 4.86c1.24 0 2.35.43 3.23 1.26l2.42-2.42A8.46 8.46 0 0 0 10 1.5 8.5 8.5 0 0 0 2.46 6.15l2.81 2.19C5.94 6.35 7.8 4.86 10 4.86Z" fill="#EA4335"/>
    </svg>
  );
}

function LinkedInIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect width="20" height="20" rx="3" fill="#0A66C2"/>
      <path d="M5.5 8H3.5v8.5h2V8ZM4.5 7a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM16.5 16.5h-2v-4.3c0-.97-.79-1.7-1.75-1.7A1.75 1.75 0 0 0 11 12.2v4.3H9V8h2v1.06A3.22 3.22 0 0 1 13.5 8C15.15 8 16.5 9.35 16.5 11v5.5Z" fill="white"/>
    </svg>
  );
}

function FacebookIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect width="20" height="20" rx="3" fill="#1877F2"/>
      <path d="M13.5 10H11.5v7h-2.5v-7H7.5V7.5H9V6a2.5 2.5 0 0 1 2.5-2.5H13.5V6H12a.5.5 0 0 0-.5.5V7.5h2l-.5 2.5Z" fill="white"/>
    </svg>
  );
}

function AppleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M13.56 10.6c-.02-1.85 1.51-2.74 1.58-2.79-0.86-1.26-2.2-1.43-2.68-1.45-1.15-.12-2.24.68-2.82.68-.58 0-1.48-.66-2.44-.64C5.9 6.42 4.82 7.1 4.22 8.17c-1.22 2.1-.31 5.23.87 6.94.58.84 1.27 1.79 2.18 1.75.87-.04 1.2-.56 2.25-.56 1.05 0 1.35.56 2.27.54.94-.02 1.54-.85 2.12-1.69.67-.97.94-1.91.96-1.96-.02-.01-1.84-.71-1.86-2.79h-.45ZM11.82 5.7c.48-.59.8-1.4.71-2.2-.69.03-1.52.46-2.01 1.04-.44.51-.83 1.34-.73 2.13.77.06 1.55-.4 2.03-.97Z" fill="white"/>
    </svg>
  );
}

const ICONS = {
  google:   GoogleIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  apple:    AppleIcon,
};

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  google:   'Continuar com Google',
  linkedin: 'Continuar com LinkedIn',
  apple:    'Continuar com Apple',
  facebook: 'Continuar com Facebook',
};

const ICON_SIZE: Record<SocialButtonSize, number> = { lg: 20, md: 20, sm: 20 };

export function SocialButton({
  provider,
  label,
  showLabel = true,
  size      = 'md',
  fullWidth = false,
  className,
  disabled,
  ...props
}: SocialButtonProps) {
  const styles   = PROVIDER_STYLES[provider];
  const IconComp = ICONS[provider];
  const text     = label ?? PROVIDER_LABELS[provider];

  return (
    <button
      disabled={disabled}
      aria-label={!showLabel ? text : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-[12px] overflow-hidden',
        'rounded-[6px] transition-all duration-150 cursor-pointer',
        'shadow-[0px_1px_2px_0px_rgba(13,13,13,0.04)]',
        'focus-visible:outline-none',
        SIZE_CLASSES[size],
        styles.base,
        styles.hover,
        styles.focus,
        fullWidth && 'w-full',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      <span className="shrink-0 flex items-center">
        <IconComp size={ICON_SIZE[size]} />
      </span>

      {showLabel && (
        <span className={cn(
          "font-[family-name:var(--font-family\\/text,'Nunito',sans-serif)]",
          'font-[var(--font-weight\\/semi-bold,600)]',
          'leading-[1.5] whitespace-nowrap',
          FONT_SIZE[size],
          styles.textColor,
        )}>
          {text}
        </span>
      )}
    </button>
  );
}
