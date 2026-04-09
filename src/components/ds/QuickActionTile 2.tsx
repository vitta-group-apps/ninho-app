/**
 * QuickActionTile — Ninho DS v2 quick action tile.
 *
 * Polish v2.1:
 * - Icon circle is 44×44 (proper touch-target inner icon)
 * - Tile has more vertical padding (py-4)
 * - Label is slightly larger (12px) for readability
 * - Subtle shadow added for lift
 * - Border is more defined at 2px
 */

interface QuickActionTileProps {
  emoji: string;
  label: string;
  onClick: () => void;
  /** Accent color (hsl string) for tile tint + label */
  accentColor: string;
}

export function QuickActionTile({ emoji, label, onClick, accentColor }: QuickActionTileProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95 w-full"
      style={{
        backgroundColor: `color-mix(in srgb, ${accentColor} 10%, hsl(var(--card)))`,
        border: `1.5px solid color-mix(in srgb, ${accentColor} 22%, transparent)`,
        boxShadow: `0 1px 4px color-mix(in srgb, ${accentColor} 8%, transparent)`,
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-[20px]"
        style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 18%, transparent)` }}
      >
        {emoji}
      </div>
      <span
        className="text-[12px] font-bold leading-tight text-center px-0.5 font-nunito"
        style={{ color: accentColor }}
      >
        {label}
      </span>
    </button>
  );
}
