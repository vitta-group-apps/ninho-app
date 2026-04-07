import { useEffect } from 'react';
import { motion } from 'framer-motion';
import simboloNinho from '../../assets/simbolo-ninho.png';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number; // ms — 2400 for new user, 1000 for returning
}

export function SplashScreen({ onFinish, duration = 2400 }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, duration);
    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: '#806e84' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
    >
      {/* Symbol in circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: [1, 1.05, 1] }}
        transition={{
          opacity: { duration: 0.5, ease: 'easeOut' },
          scale: {
            times: [0, 0.5, 1],
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          },
        }}
        className="mb-7"
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <img
          src={simboloNinho}
          alt="Ninho símbolo"
          style={{ width: 52, height: 52, objectFit: 'contain' }}
        />
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="text-[42px] font-bold tracking-tight"
        style={{
          color: 'white',
          fontFamily: 'Quicksand, sans-serif',
          letterSpacing: '-0.02em',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        ninho
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-2 text-[15px] text-center"
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'Nunito, sans-serif',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        Cuide com mais leveza.
      </motion.p>
    </motion.div>
  );
}
