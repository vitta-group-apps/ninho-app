import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
    >
      {/* Logo */}
      <motion.div
        className="flex flex-col items-center mb-12"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
          <path
            d="M 18 72 Q 8 32 50 18 Q 92 8 88 50 Q 84 82 50 88 Q 22 92 18 72"
            stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"
          />
          <path
            d="M 30 66 Q 24 44 50 36 Q 74 28 72 52 Q 70 70 50 74 Q 32 77 30 66"
            stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round" fill="none"
          />
          <circle cx="50" cy="55" r="7" fill="white" />
          <circle cx="37" cy="53" r="3.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="63" cy="53" r="3.5" fill="rgba(255,255,255,0.6)" />
        </svg>
        <h1
          className="text-4xl font-bold text-white mt-3 tracking-tight"
          style={{ fontFamily: 'Quicksand, sans-serif' }}
        >
          ninho
        </h1>
      </motion.div>

      {/* Copy */}
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <p
          className="text-white/90 text-lg leading-relaxed max-w-xs"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Ninho helps families coordinate child health, routine and development.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="w-full max-w-xs"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Button
          onClick={() => navigate('/onboarding/auth')}
          className="w-full h-14 rounded-2xl text-base font-bold"
          style={{
            backgroundColor: 'hsl(var(--ninho-sage))',
            color: 'white',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          Começar
        </Button>
      </motion.div>
    </div>
  );
}
