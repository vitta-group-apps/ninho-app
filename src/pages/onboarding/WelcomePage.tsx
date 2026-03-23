import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import heroPhoto from '@/assets/onboarding-hero.jpg';
import simboloNinho from '@/assets/simbolo-ninho.png';

const slides = [
{
  title: 'Tudo importante da criança em um só lugar',
  body: 'Mamadas, sono, fraldas, vacinas, consultas e sintomas — registre rápido e acompanhe sem se perder.'
},
{
  title: 'Ajuda para lembrar, organizar e compartilhar o cuidado',
  body: 'Receba lembretes, prepare-se para consultas e convide quem cuida com você para acompanhar em tempo real.'
}];


export default function WelcomePage() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const isLast = slide === slides.length - 1;

  function next() {
    if (isLast) {
      navigate('/onboarding/auth');
    } else {
      setSlide((s) => s + 1);
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Hero photo */}
      <div className="absolute inset-0">
        <img
          src={heroPhoto}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center top' }} />
        
        {/* Gradient overlay — deepens toward bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to bottom, rgba(64,42,68,0.45) 0%, rgba(64,42,68,0.72) 45%, rgba(50,32,54,0.92) 100%)'
          }} />
        
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-14 pb-10">
        {/* Logo + brand at top */}
        <div className="flex items-center gap-3 mb-auto">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.25)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            
            <img src={simboloNinho} alt="Ninho" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          </div>
          <span
            style={{ color: 'white', fontFamily: 'Quicksand, sans-serif', fontWeight: 700, fontSize: 22 }}>
            
            Ninho
          </span>
        </div>

        {/* Slide content */}
        <div className="mt-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}>
              
              <h2
                className="text-[28px] font-bold leading-tight mb-4"
                style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}>
                
                {slides[slide].title}
              </h2>
              <p
                className="text-[15px] leading-relaxed mb-8"
                style={{ color: 'rgba(255,255,255,0.78)', fontFamily: 'Nunito, sans-serif' }}>
                
                {slides[slide].body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex gap-2 mb-7">
            {slides.map((_, i) =>
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                height: 6,
                width: i === slide ? 22 : 6,
                borderRadius: 99,
                backgroundColor: i === slide ? 'white' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }} />

            )}
          </div>

          {/* CTA button */}
          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-2 font-bold text-[15px] rounded-2xl"
            style={{
              height: 52,
              backgroundColor: isLast ? '#806e84' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: isLast ? 'none' : '1.5px solid rgba(255,255,255,0.35)',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
              transition: 'background 0.3s ease'
            }}>
            
            {isLast ? 'Vamos começar →' : 'Próximo →'}
          </button>

          {/* Skip */}
          <button
            onClick={() => navigate('/onboarding/auth?tab=login')}
            className="w-full text-center mt-4 text-[13px]"
            style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif' }}>
            
            Já tenho uma conta
          </button>
        </div>
      </div>
    </div>);

}