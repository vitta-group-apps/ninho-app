/**
 * ScreenHeader — Ninho DS v2 canonical screen header.
 *
 * Anatomy:
 *   [BackButton]  [Title + ChildContext]  [StatusPill?]
 *
 * Polish v2.1:
 * - Taller hit-target back button (44×44 minimum, now 44px circle)
 * - Title is larger and bolder — Quicksand 17px semibold
 * - Child context sits tighter under title with dot separator
 * - Status slot right-aligned, never wraps
 * - More breathing room below header band (18px pb)
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
        paddingBottom: '16px',
      }}
    >
      {/* Back button — 44×44 minimum, circle */}
      <button
        onClick={handleBack}
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 bg-muted hover:bg-secondary"
        aria-label="Voltar"
      >
        <ArrowLeftIcon className="w-5 h-5 text-foreground" strokeWidth={2.5} />
      </button>

      {/* Title + child context — flexible middle */}
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-semibold leading-tight truncate text-foreground font-quicksand">
          {title}
        </p>
        {childName && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
            <p className="text-[12px] text-muted-foreground font-nunito leading-tight truncate">
              {childName}
            </p>
          </div>
        )}
      </div>

      {/* Optional right slot — never wraps */}
      {statusSlot && (
        <div className="flex-shrink-0 ml-1">
          {statusSlot}
        </div>
      )}
    </div>
  );
}
