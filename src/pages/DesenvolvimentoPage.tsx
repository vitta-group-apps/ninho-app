/**
 * DesenvolvimentoPage — Structural shell for child development section.
 *
 * Sections:
 *  - Visão geral (age context + current phase)
 *  - Marcos (milestones by domain)
 *  - Atividades (age-appropriate activity suggestions)
 *
 * Architecture: scalable for Denver II milestones, age-based suggestions.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  StarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { useActiveChild } from '@/contexts/ActiveChildContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type DevTab = 'overview' | 'milestones' | 'activities';

const TABS: { id: DevTab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Visão geral', Icon: SparklesIcon },
  { id: 'milestones', label: 'Marcos',      Icon: StarIcon },
  { id: 'activities', label: 'Atividades',  Icon: LightBulbIcon },
];

const GOLD = 'hsl(40,80%,52%)';
const font = 'Nunito, sans-serif';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAgeMonths(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate + 'T00:00:00');
  const diff = today.getTime() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
}

function getPhaseLabel(months: number): string {
  if (months < 1)  return 'Recém-nascido';
  if (months < 3)  return 'Primeiro trimestre';
  if (months < 6)  return 'Segundo trimestre';
  if (months < 9)  return 'Terceiro trimestre';
  if (months < 12) return 'Quarto trimestre';
  if (months < 18) return '1 a 1,5 anos';
  if (months < 24) return '1,5 a 2 anos';
  if (months < 36) return '2 a 3 anos';
  return `${Math.floor(months / 12)} anos`;
}

// ─── Domain milestone data ────────────────────────────────────────────────────

interface MilestoneDomain {
  emoji: string;
  label: string;
  description: string;
  ageHint: string;
}

function getMilestonesForAge(months: number): MilestoneDomain[] {
  if (months <= 2) return [
    { emoji: '👁️', label: 'Visual', description: 'Segue objetos com os olhos a 20–30 cm', ageHint: '0–2 meses' },
    { emoji: '😄', label: 'Social', description: 'Sorri em resposta ao rosto e voz da mãe', ageHint: '0–2 meses' },
    { emoji: '🗣️', label: 'Comunicação', description: 'Emite sons guturais e pequenos gorjeios', ageHint: '0–2 meses' },
    { emoji: '💪', label: 'Motor', description: 'Eleva levemente a cabeça em decúbito ventral', ageHint: '0–2 meses' },
  ];
  if (months <= 4) return [
    { emoji: '💪', label: 'Motor', description: 'Sustenta a cabeça por alguns segundos', ageHint: '3–4 meses' },
    { emoji: '✋', label: 'Motor fino', description: 'Abre e fecha as mãos', ageHint: '3–4 meses' },
    { emoji: '😄', label: 'Social', description: 'Ri em voz alta', ageHint: '3–4 meses' },
    { emoji: '🗣️', label: 'Comunicação', description: 'Balbucia e vocaliza', ageHint: '3–4 meses' },
  ];
  if (months <= 6) return [
    { emoji: '🔄', label: 'Motor', description: 'Rola de supino para prono', ageHint: '4–6 meses' },
    { emoji: '✋', label: 'Motor fino', description: 'Pega objetos com ambas as mãos', ageHint: '4–6 meses' },
    { emoji: '😄', label: 'Social', description: 'Reconhece pessoas familiares', ageHint: '4–6 meses' },
    { emoji: '🗣️', label: 'Comunicação', description: 'Produz sílabas como "ba", "ma"', ageHint: '5–6 meses' },
  ];
  // Generic for older
  return [
    { emoji: '🚶', label: 'Motor', description: 'Desenvolvimento motor conforme fase atual', ageHint: `${Math.floor(months / 12)}a ${months % 12}m` },
    { emoji: '🗣️', label: 'Linguagem', description: 'Expansão de vocabulário e comunicação', ageHint: `${Math.floor(months / 12)}a ${months % 12}m` },
    { emoji: '🧠', label: 'Cognitivo', description: 'Exploração, atenção e resolução de problemas', ageHint: `${Math.floor(months / 12)}a ${months % 12}m` },
    { emoji: '🤝', label: 'Social', description: 'Interação com outras crianças e adultos', ageHint: `${Math.floor(months / 12)}a ${months % 12}m` },
  ];
}

function getActivitiesForAge(months: number): { emoji: string; title: string; description: string }[] {
  if (months <= 3) return [
    { emoji: '🎵', title: 'Conversar cantando', description: 'Cantar músicas de ninar estimula linguagem e conexão.' },
    { emoji: '👁️', title: 'Seguir objetos', description: 'Mova um objeto colorido lentamente para estimular o rastreamento visual.' },
    { emoji: '🤱', title: 'Tempo de barriga', description: 'Coloque de bruços por alguns minutos para fortalecer pescoço e ombros.' },
  ];
  if (months <= 6) return [
    { emoji: '🔮', title: 'Objetos de textura', description: 'Ofereça objetos com diferentes texturas para explorar.' },
    { emoji: '🪞', title: 'Espelho', description: 'Mostre o reflexo — bebês adoram explorar o próprio rosto.' },
    { emoji: '🎵', title: 'Ritmo e música', description: 'Bata palmas ao ritmo de músicas para estimular coordenação.' },
  ];
  if (months <= 12) return [
    { emoji: '🏗️', title: 'Empilhar blocos', description: 'Blocos de cores e formas estimulam coordenação e cognição.' },
    { emoji: '📚', title: 'Livros de imagem', description: 'Nomear figuras em livros coloridos ajuda no desenvolvimento da linguagem.' },
    { emoji: '🎭', title: 'Jogo de esconde-esconde', description: 'Estimula a permanência do objeto e a interação social.' },
  ];
  return [
    { emoji: '🎨', title: 'Atividades criativas', description: 'Desenhar, pintar e modelar estimulam coordenação e expressão.' },
    { emoji: '📚', title: 'Leitura conjunta', description: 'Ler juntos expande vocabulário e cria vínculo.' },
    { emoji: '🏃', title: 'Movimento livre', description: 'Brincar ao ar livre favorece desenvolvimento motor e bem-estar.' },
  ];
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center px-8 pt-12 pb-6">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 text-4xl"
        style={{ backgroundColor: `${GOLD}15` }}>
        {emoji}
      </div>
      <p className="text-lg font-bold mb-2"
        style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>{title}</p>
      <p className="text-sm leading-relaxed"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>{description}</p>
    </motion.div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function OverviewSection() {
  const { activeChild, getAgeLabel } = useActiveChild();

  if (!activeChild) {
    return <EmptyState emoji="👶" title="Nenhuma criança ativa"
      description="Selecione uma criança para ver o painel de desenvolvimento." />;
  }

  const months = getAgeMonths(activeChild.birth_date);
  const phase = getPhaseLabel(months);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 space-y-5">
      {/* Phase card */}
      <div className="rounded-2xl p-5"
        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${GOLD}15` }}>✨</div>
          <div>
            <p className="text-base font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              {activeChild.name}
            </p>
            <p className="text-sm font-semibold" style={{ color: GOLD, fontFamily: font }}>
              {phase} · {getAgeLabel(activeChild.birth_date)}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
          Nesta fase, {activeChild.name} está em pleno desenvolvimento sensorial, motor e social.
          Acompanhe os marcos e experimente as atividades sugeridas para esta faixa etária.
        </p>
      </div>

      {/* Domains preview */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
          Áreas de desenvolvimento
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '💪', label: 'Motor' },
            { emoji: '🗣️', label: 'Linguagem' },
            { emoji: '🧠', label: 'Cognitivo' },
            { emoji: '🤝', label: 'Social' },
          ].map(d => (
            <div key={d.label} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <span className="text-xl">{d.emoji}</span>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                {d.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MilestonesSection() {
  const { activeChild } = useActiveChild();

  if (!activeChild) {
    return <EmptyState emoji="⭐" title="Nenhuma criança ativa"
      description="Selecione uma criança para ver os marcos de desenvolvimento." />;
  }

  const months = getAgeMonths(activeChild.birth_date);
  const milestones = getMilestonesForAge(months);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider mb-1"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
        Esperados para esta fase
      </p>
      {milestones.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <span className="text-xl flex-shrink-0">{m.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                {m.label}
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: `${GOLD}15`, color: GOLD, fontFamily: font }}>
                {m.ageHint}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              {m.description}
            </p>
          </div>
        </motion.div>
      ))}
      <p className="text-xs text-center pt-2 pb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
        Baseado na escala Denver II. Cada criança tem seu próprio ritmo.
      </p>
    </motion.div>
  );
}

function ActivitiesSection() {
  const { activeChild } = useActiveChild();

  if (!activeChild) {
    return <EmptyState emoji="💡" title="Nenhuma criança ativa"
      description="Selecione uma criança para ver sugestões de atividades." />;
  }

  const months = getAgeMonths(activeChild.birth_date);
  const activities = getActivitiesForAge(months);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider mb-1"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
        Sugeridas para esta fase
      </p>
      {activities.map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${GOLD}15` }}>
            {a.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold mb-1"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              {a.title}
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              {a.description}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DesenvolvimentoPage() {
  const [activeTab, setActiveTab] = useState<DevTab>('overview');

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          background: `linear-gradient(135deg, ${GOLD}, hsl(40,70%,62%))`,
        }}
      >
        <h1 className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Quicksand, sans-serif' }}>Crescer</h1>
        <p className="text-sm text-white/70 mt-0.5"
          style={{ fontFamily: font }}>Marcos e desenvolvimento</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold transition-colors relative"
              style={{ color: isActive ? GOLD : 'hsl(var(--muted-foreground))', fontFamily: font }}>
              <tab.Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div layoutId="dev-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: GOLD }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {activeTab === 'overview'   && <OverviewSection />}
          {activeTab === 'milestones' && <MilestonesSection />}
          {activeTab === 'activities' && <ActivitiesSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
