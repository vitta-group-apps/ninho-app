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
    <div className="flex-1 min-w-0 rounded-2xl px-3 pt-3.5 pb-3 flex flex-col gap-1.5 bg-card border border-border">
      {/* Icon + label row */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[12px] flex-shrink-0"
          style={{ backgroundColor: tint }}
        >
          {emoji}
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-nunito leading-none">
          {label}
        </p>
      </div>

      {/* BIG NUMBER — dominant visual */}
      <p
        className={`text-[26px] font-bold leading-none font-quicksand ${empty ? 'opacity-30' : 'text-foreground'}`}
        style={!empty && accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </p>

      {/* Sub line — 2 lines max, small */}
      {sub && (
        <p className="text-[10px] text-muted-foreground font-nunito leading-tight line-clamp-2">
          {sub}
        </p>
      )}
    </div>
  );
}
