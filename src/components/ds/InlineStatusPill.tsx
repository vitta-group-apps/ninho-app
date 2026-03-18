/**
 * InlineStatusPill — Ninho DS v2 status indicator pill.
 *
 * Polish v2.1:
 * - Pill is taller (py-1.5) for better readability in header
 * - Active dot is slightly larger (2×2)
 * - Font is 11px bold — clear but not oversized
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
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{
        backgroundColor: isPaused
          ? 'hsl(var(--muted))'
          : `color-mix(in srgb, ${resolvedColor} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${resolvedColor} 28%, transparent)`,
      }}
    >
      {isActive && (
        <div
          className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
          style={{ backgroundColor: resolvedColor }}
        />
      )}
      <span
        className="text-[11px] font-bold font-nunito leading-none whitespace-nowrap"
        style={{ color: resolvedColor }}
      >
        {label}
      </span>
    </div>
  );
}
