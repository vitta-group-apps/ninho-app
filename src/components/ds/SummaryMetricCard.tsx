/**
 * SummaryMetricCard — Ninho DS v2 daily metric card.
 *
 * Polish v2.1:
 * - Icon container is larger (36×36) with softer radius
 * - Label is clearly separated from value with more space
 * - Value is bolder and larger (text-base)
 * - Sub line has better contrast
 * - Card padding increased to 16px with 14px gap
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
    <div className="flex-1 min-w-0 rounded-2xl px-4 pt-4 pb-3.5 flex flex-col gap-3 bg-card border border-border">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
        style={{ backgroundColor: tint }}
      >
        {emoji}
      </div>

      {/* Data */}
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-nunito leading-none">
          {label}
        </p>
        <p
          className={`text-[15px] font-bold leading-snug font-quicksand text-foreground ${empty ? 'opacity-35' : ''}`}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground font-nunito leading-tight">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
