import { TopHeader } from '@/components/layout/TopHeader';
import { ChildSwitcher } from '@/components/home/ChildSwitcher';
import { EmergencyBanner } from '@/components/home/EmergencyBanner';
import { VaccineCard } from '@/components/home/VaccineCard';
import { DevCard } from '@/components/home/DevCard';
import { FAB } from '@/components/home/FAB';
import { useChild } from '@/hooks/useChild';
import { motion } from 'framer-motion';

export default function Home() {
  const { activeChild, children, getAgeLabel, setActiveChildId } = useChild();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      <TopHeader
        title="Olá, Família 👋"
        subtitle={
          <ChildSwitcher
            activeChild={activeChild}
            children={children}
            getAgeLabel={getAgeLabel}
            onSwitch={setActiveChildId}
          />
        }
      />

      <motion.div
        className="pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Section label */}
        <p
          className="px-5 mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: 'hsl(var(--ninho-brown) / 0.5)', fontFamily: 'Nunito, sans-serif' }}
        >
          Resumo de {activeChild.name}
        </p>

        <EmergencyBanner child={activeChild} />
        <VaccineCard child={activeChild} />
        <DevCard child={activeChild} />

        {/* Quick tips */}
        <div className="mx-5 mt-2 mb-4 rounded-2xl p-4 bg-white shadow-sm" style={{ border: '1px solid hsl(var(--border))' }}>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}
          >
            💡 Dica do Dia
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
          >
            Converse com seu bebê durante as trocas e banhos. A estimulação vocal fortalece os laços afetivos e o desenvolvimento da linguagem. 🗣️❤️
          </p>
        </div>
      </motion.div>

      <FAB />
    </div>
  );
}
