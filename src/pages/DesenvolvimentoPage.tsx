import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/outline';

export default function DesenvolvimentoPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      <div
        className="px-5 pt-14 pb-5"
        style={{ backgroundColor: 'hsl(40 60% 55%)' }}
      >
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Quicksand, sans-serif' }}
        >
          Desenvolvimento
        </h1>
        <p
          className="text-sm text-white/70 mt-0.5"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Marcos e conquistas
        </p>
      </div>

      <motion.div
        className="flex flex-col items-center justify-center px-5 pt-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ backgroundColor: 'hsl(40 60% 55% / 0.12)' }}
        >
          <StarIcon className="w-10 h-10" style={{ color: 'hsl(40 60% 55%)' }} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          Desenvolvimento
        </h2>
        <p
          className="text-sm max-w-xs"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Marcos motores, cognitivos e sociais por faixa etária (escala Denver II).
        </p>
        <div
          className="mt-6 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'hsl(40 60% 55% / 0.12)', color: 'hsl(40 55% 45%)', fontFamily: 'Nunito, sans-serif' }}
        >
          🚧 Em desenvolvimento
        </div>
      </motion.div>
    </div>
  );
}
