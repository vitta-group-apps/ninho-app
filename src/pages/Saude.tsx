import { TopHeader } from '@/components/layout/TopHeader';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function Saude() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      <TopHeader title="Saúde" />
      <motion.div
        className="flex flex-col items-center justify-center px-5 pt-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.12)' }}
        >
          <ClipboardDocumentListIcon className="w-10 h-10" style={{ color: 'hsl(var(--ninho-mauve))' }} />
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          Saúde & Vacinas
        </h2>
        <p
          className="text-base max-w-xs"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Em breve: histórico de vacinas, registro de febres e timeline médica completa.
        </p>
        <div
          className="mt-6 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.12)', color: 'hsl(var(--ninho-mauve))', fontFamily: 'Nunito, sans-serif' }}
        >
          🚧 Em desenvolvimento
        </div>
      </motion.div>
    </div>
  );
}
