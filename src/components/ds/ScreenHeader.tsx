/**
 * ScreenHeader — Ninho DS v2 canonical screen header.
 *
 * Anatomy:
 *   [BackButton]  [Title + ChildContext]  [StatusPill?]
 *
 * Rules:
 * - Fixed to top, safe-area aware.
 * - Never breaks on narrow screens.
 * - Child context always visible beneath title.
 * - Optional right-side status pill (active session indicator, etc.)
 */

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface ScreenHeaderProps {
  title: string;
  childName?: string | null;
  onBack?: () => void;
  /** Optional right-side pill/badge */
  statusSlot?: React.ReactNode;
}

export function ScreenHeader({ title, childName, onBack, statusSlot }: ScreenHeaderProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) onBack();
    else navigate(-1);
  }

  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-4 bg-card border-b border-border"
      style={{
        paddingTop: 'max(52px, env(safe-area-inset-top))',
        paddingBottom: '14px',
      }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 bg-muted"
        aria-label="Voltar"
      >
        <ArrowLeftIcon className="w-5 h-5 text-foreground" />
      </button>

      {/* Title + child context */}
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-bold leading-tight truncate text-foreground font-quicksand"
        >
          {title}
        </p>
        {childName && (
          <p className="text-xs text-muted-foreground font-nunito mt-0.5 leading-tight">
            {childName}
          </p>
        )}
      </div>

      {/* Optional right slot */}
      {statusSlot && (
        <div className="flex-shrink-0">
          {statusSlot}
        </div>
      )}
    </div>
  );
}
