/**
 * QuickActionTile — Ninho DS v2 quick action tile.
 *
 * Rules:
 * - Fixed square tile with centered icon + label below
 * - Only brand-approved color tints (no custom color injections)
 * - Min touch target 44x44
 * - No extra tiles beyond the 4 core routines
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
      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 w-full"
      style={{
        backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }}
      >
        {emoji}
      </div>
      <span
        className="text-[11px] font-bold leading-tight text-center px-1 font-nunito"
        style={{ color: accentColor }}
      >
        {label}
      </span>
    </button>
  );
}
