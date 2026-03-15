import { motion } from 'framer-motion';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function FamiliaPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      <div
        className="px-5 pt-14 pb-5"
        style={{ backgroundColor: 'hsl(var(--ninho-brown))' }}
      >
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Quicksand, sans-serif' }}
        >
          Família
        </h1>
        <p
          className="text-sm text-white/70 mt-0.5"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Cuidadores e crianças
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
          style={{ backgroundColor: 'hsl(var(--ninho-brown) / 0.08)' }}
        >
          <UserGroupIcon className="w-10 h-10" style={{ color: 'hsl(var(--ninho-brown))' }} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          Família
        </h2>
        <p
          className="text-sm max-w-xs"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Gerencie cuidadores, convide colaboradores e configure as crianças do grupo familiar.
        </p>
        <div
          className="mt-6 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'hsl(var(--ninho-brown) / 0.08)', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
        >
          🚧 Em desenvolvimento
        </div>
      </motion.div>
    </div>
  );
}
