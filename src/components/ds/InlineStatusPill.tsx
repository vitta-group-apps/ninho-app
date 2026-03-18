/**
 * InlineStatusPill — Ninho DS v2 status indicator pill.
 *
 * Variants:
 *  - active: pulsing dot + green/brand color
 *  - paused: no dot + muted
 *  - info: neutral
 *  - report: warm accent
 */

type PillVariant = 'active' | 'paused' | 'info';

interface InlineStatusPillProps {
  label: string;
  variant: PillVariant;
  /** Optional override accent color (hsl string) */
  color?: string;
}

export function InlineStatusPill({ label, variant, color }: InlineStatusPillProps) {
  const isActive = variant === 'active';
  const isPaused = variant === 'paused';

  const resolvedColor = color ?? (isPaused ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))');

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: isPaused ? 'hsl(var(--muted))' : `color-mix(in srgb, ${resolvedColor} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${resolvedColor} 30%, transparent)`,
      }}
    >
      {isActive && (
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
          style={{ backgroundColor: resolvedColor }}
        />
      )}
      <span
        className="text-[11px] font-bold font-nunito leading-none"
        style={{ color: resolvedColor }}
      >
        {label}
      </span>
    </div>
  );
}
