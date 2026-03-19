import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}>
      
      {/* Ninho Nest Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-8">
        
        <svg
          width="96"
          height="96"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          
          {/* Outer nest arc */}
          <motion.path
            d="M 18 72 Q 8 32 50 18 Q 92 8 88 50 Q 84 82 50 88 Q 22 92 18 72"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: 'easeInOut', delay: 0.1 }} />
          
          {/* Middle arc */}
          <motion.path
            d="M 30 66 Q 24 44 50 36 Q 74 28 72 52 Q 70 70 50 74 Q 32 77 30 66"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.85, ease: 'easeInOut', delay: 0.3 }} />
          
          {/* Center egg */}
          <motion.circle
            cx="50"
            cy="55"
            r="7"
            fill="white"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.85 }} />
          
          {/* Side eggs */}
          <motion.circle
            cx="37"
            cy="53"
            r="3.5"
            fill="rgba(255,255,255,0.65)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.95 }} />
          
          <motion.circle
            cx="63"
            cy="53"
            r="3.5"
            fill="rgba(255,255,255,0.65)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.0 }} />
          
        </svg>
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="text-5xl font-bold tracking-tight"
        style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75 }}>
        
        ninho
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-3 text-base text-center px-8"
        style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'Nunito, sans-serif' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}>
        
        Organize saúde, rotina e desenvolvimento da criança.

      </motion.p>
    </motion.div>);
}