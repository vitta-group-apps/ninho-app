/**
 * SummaryMetricCard — Ninho DS v3 daily metric card.
 *
 * v3 upgrade: BIG NUMBER hierarchy.
 * - Value is now large and dominant (text-[28px]) — the number reads first
 * - Label is small and secondary above the number
 * - Sub line is a quiet third tier
 * - Empty state uses opacity, not placeholder text
 */

interface SummaryMetricCardProps {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
  /** If true, value renders at lower opacity — signals "no data yet" */
  empty?: boolean;
  /** Accent color for the icon container tint (hsl string) */
  accentColor?: string;
}

export function SummaryMetricCard({
  emoji, label, value, sub, empty, accentColor,
}: SummaryMetricCardProps) {
  const tint = accentColor
    ? `color-mix(in srgb, ${accentColor} 16%, transparent)`
    : 'hsl(var(--muted))';

  return (
    <div className="flex-1 min-w-0 rounded-2xl px-4 pt-4 pb-3.5 flex flex-col gap-2 bg-card border border-border">
      {/* Icon + label row */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
          style={{ backgroundColor: tint }}
        >
          {emoji}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-nunito leading-none truncate">
          {label}
        </p>
      </div>

      {/* BIG NUMBER — dominant visual */}
      <div>
        <p
          className={`text-[28px] font-bold leading-none font-quicksand ${empty ? 'opacity-30' : 'text-foreground'}`}
          style={!empty && accentColor ? { color: accentColor } : undefined}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] mt-1 text-muted-foreground font-nunito leading-tight">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
