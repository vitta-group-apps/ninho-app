import { useState } from 'react';
import { ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useActiveChild, type Child } from '@/contexts/ActiveChildContext';

export function ChildSwitcher() {
  const { children, activeChild, setActiveChildId, getAgeLabel, loading } = useActiveChild();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl animate-pulse"
        style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.15)' }}>
        <div className="w-9 h-9 rounded-full bg-white/20" />
        <div className="space-y-1">
          <div className="h-3 w-20 rounded-full bg-white/20" />
          <div className="h-2.5 w-12 rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  if (!activeChild) return null;

  return (
    <>
      <button
        onClick={() => children.length > 1 && setOpen(true)}
        className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all active:scale-95"
        style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.15)' }}
        aria-label="Selecionar criança"
      >
        {/* Avatar */}
        <ChildAvatar child={activeChild} size={36} />

        {/* Name + age */}
        <div className="text-left">
          <p className="text-sm font-bold text-white leading-tight" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            {activeChild.name}
          </p>
          <p className="text-xs text-white/70" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {getAgeLabel(activeChild.birth_date)}
          </p>
        </div>

        {/* Chevron only when multiple children */}
        {children.length > 1 && (
          <ChevronDownIcon className="w-4 h-4 text-white/70 ml-1" />
        )}
      </button>

      {/* Switcher sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <SheetHeader className="mb-4">
            <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
              Selecionar criança
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {children.map(child => {
              const isActive = child.id === activeChild.id;
              return (
                <button
                  key={child.id}
                  onClick={() => { setActiveChildId(child.id); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-98"
                  style={{
                    backgroundColor: isActive ? 'hsl(var(--accent))' : 'transparent',
                    border: `1.5px solid ${isActive ? 'hsl(var(--ninho-sage))' : 'hsl(var(--border))'}`,
                  }}
                >
                  <ChildAvatar child={child} size={44} />
                  <div className="text-left flex-1">
                    <p className="font-bold text-sm" style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
                      {child.name}
                    </p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                      {getAgeLabel(child.birth_date)}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}>
                      <CheckIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ChildAvatar({ child, size = 36 }: { child: Child; size?: number }) {
  const initials = child.name.trim().charAt(0).toUpperCase();

  // Generate a stable pastel from name
  const hue = [...child.name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  if (child.avatar_url) {
    return (
      <img
        src={child.avatar_url}
        alt={child.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: `hsl(${hue} 50% 80%)`,
        color: `hsl(${hue} 40% 30%)`,
        fontFamily: 'Quicksand, sans-serif',
      }}
    >
      {initials}
    </div>
  );
}
