import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface FABAction {
  emoji: string;
  label: string;
  onClick: () => void;
}

const defaultActions: FABAction[] = [
  { emoji: '📝', label: 'Anotação', onClick: () => console.log('Anotação') },
  { emoji: '🌡️', label: 'Febre', onClick: () => console.log('Febre') },
  { emoji: '🍼', label: 'Rotina', onClick: () => console.log('Rotina') },
];

export function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-3">
        {/* Sub-actions */}
        <AnimatePresence>
          {open && defaultActions.map((action, i) => (
            <motion.button
              key={action.label}
              onClick={() => { action.onClick(); setOpen(false); }}
              className="flex items-center gap-2.5 rounded-full py-2.5 px-4 shadow-lg"
              style={{ backgroundColor: 'white' }}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.85 }}
              transition={{
                duration: 0.2,
                delay: open ? (2 - i) * 0.05 : i * 0.03,
                type: 'spring',
                stiffness: 350,
                damping: 28,
              }}
            >
              <span className="text-lg">{action.emoji}</span>
              <span
                className="text-sm font-bold"
                style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
              >
                {action.label}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {open
            ? <XMarkIcon className="w-6 h-6 text-white" />
            : <PlusIcon className="w-6 h-6 text-white" />
          }
        </motion.button>
      </div>
    </>
  );
}
