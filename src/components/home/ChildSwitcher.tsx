import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { useActiveChild, type Child } from '../contexts/ActiveChildContext';
import { PaywallGate } from '../components/PaywallGate';

export function ChildSwitcher() {
  const navigate = useNavigate();
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
  onClick={() => setOpen(true)}
  className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all active:scale-95"
  style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.15)' }}
  aria-label="Selecionar criança"
>
  <ChildAvatar child={activeChild} size={36} />

  <div className="text-left flex-1 min-w-0">
    <p
      className="text-sm font-bold text-white leading-tight"
      style={{ fontFamily: 'Quicksand, sans-serif' }}
    >
      {activeChild.name}
    </p>
    <p
      className="text-xs text-white/70"
      style={{ fontFamily: 'Nunito, sans-serif' }}
    >
      {getAgeLabel(activeChild.birth_date)} · tocar para trocar
    </p>
  </div>

  <ChevronDownIcon className="w-4 h-4 text-white/70 ml-1 flex-shrink-0" />
</button>

      {/* Switcher sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <SheetHeader className="mb-4">
            <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
              Selecionar criança
            </SheetTitle>
          </SheetHeader>
          <PaywallGate feature="segunda_crianca">
  <button
    onClick={() => {
      setOpen(false);
      navigate('/family/add-child');
    }}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-98"
    style={{
      backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)',
      border: '1.5px dashed hsl(var(--ninho-mauve) / 0.35)',
    }}
  >
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.14)' }}
    >
      <PlusIcon className="w-5 h-5" style={{ color: 'hsl(var(--ninho-mauve))' }} />
    </div>

    <div className="text-left flex-1">
      <p
        className="font-bold text-sm"
        style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}
      >
        Adicionar outra criança
      </p>
      <p
        className="text-xs"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
      >
        Recurso disponível no Premium
      </p>
    </div>
  </button>
</PaywallGate>
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
