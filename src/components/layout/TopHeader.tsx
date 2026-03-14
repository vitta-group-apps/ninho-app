import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TopHeaderProps {
  title: string;
  rightSlot?: ReactNode;
  subtitle?: ReactNode;
}

export function TopHeader({ title, rightSlot, subtitle }: TopHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Scroll sentinel */}
      <div ref={sentinelRef} className="h-px w-full" />

      <motion.header
        className="sticky top-0 z-30 px-5 transition-all"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingBottom: scrolled ? '12px' : '8px',
          background: scrolled
            ? 'rgba(247,245,242,0.92)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(90,74,66,0.08)' : '1px solid transparent',
        }}
        animate={{ paddingBottom: scrolled ? 12 : 8 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between">
          <motion.h1
            className="font-bold leading-tight"
            style={{
              fontFamily: 'Quicksand, sans-serif',
              color: 'hsl(var(--ninho-brown))',
            }}
            animate={{ fontSize: scrolled ? '20px' : '28px' }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h1>
          {rightSlot && (
            <div className="mt-1 flex-shrink-0">{rightSlot}</div>
          )}
        </div>
        {subtitle && !scrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2"
          >
            {subtitle}
          </motion.div>
        )}
      </motion.header>
    </>
  );
}
