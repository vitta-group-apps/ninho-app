import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { MockChild, useChild } from '@/hooks/useChild';

interface ChildSwitcherProps {
  activeChild: MockChild;
  children: MockChild[];
  getAgeLabel: (d: Date) => string;
  onSwitch: (id: string) => void;
}

export function ChildSwitcher({ activeChild, children, getAgeLabel, onSwitch }: ChildSwitcherProps) {
  const [open, setOpen] = useState(false);

  const initials = activeChild.name.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Pill button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition-transform active:scale-95"
        style={{ backgroundColor: 'white' }}
      >
        {/* Avatar */}
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: activeChild.avatarColor }}
        >
          {initials}
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
        >
          {activeChild.name}
          <span className="font-normal opacity-60 ml-1">
            · {getAgeLabel(activeChild.birthDate)}
          </span>
        </span>
        <ChevronDownIcon className="w-3.5 h-3.5 opacity-40" style={{ color: 'hsl(var(--ninho-brown))' }} />
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl bg-white"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--border))' }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <h3
                  className="text-lg font-bold"
                  style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
                >
                  Selecionar Criança
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                >
                  <XMarkIcon className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </button>
              </div>

              {/* Children list */}
              <div className="px-5 space-y-3">
                {children.map((child) => {
                  const isActive = child.id === activeChild.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => { onSwitch(child.id); setOpen(false); }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                      style={{
                        backgroundColor: isActive ? 'hsl(var(--ninho-sage) / 0.12)' : 'hsl(var(--ninho-sand))',
                        border: isActive ? '1.5px solid hsl(var(--ninho-sage) / 0.4)' : '1.5px solid transparent',
                      }}
                    >
                      <span
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: child.avatarColor }}
                      >
                        {child.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p
                          className="font-bold text-base"
                          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
                        >
                          {child.name}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
                        >
                          {getAgeLabel(child.birthDate)} · {child.birthDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {isActive && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Add child button */}
                <button
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed transition-opacity hover:opacity-70 mb-4"
                  style={{ borderColor: 'hsl(var(--ninho-sage) / 0.4)', color: 'hsl(var(--ninho-sage))' }}
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Adicionar filho
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
