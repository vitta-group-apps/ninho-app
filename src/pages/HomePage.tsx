import { motion } from 'framer-motion';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div
        className="px-5 pt-14 pb-5"
        style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
      >
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Quicksand, sans-serif' }}
        >
          Início
        </h1>
        <p
          className="text-sm text-white/70 mt-0.5"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Bem-vindo ao Ninho
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
          style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.12)' }}
        >
          <HomeIcon className="w-10 h-10" style={{ color: 'hsl(var(--ninho-mauve))' }} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          Dashboard em breve
        </h2>
        <p
          className="text-sm max-w-xs"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Aqui você verá o resumo do dia, próximas vacinas e marcos de desenvolvimento.
        </p>
      </motion.div>
    </div>
  );
}
