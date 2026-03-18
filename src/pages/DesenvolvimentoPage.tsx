/**
 * DesenvolvimentoPage — Crescer v2: live milestone progression system.
 *
 * Intelligence v2:
 * - SummaryMetricCard shows progress (achieved / total)
 * - ChipGroup used for domain filter and milestone achievement
 * - Each milestone can be marked achieved (persisted in localStorage per child)
 * - Categories: motor, linguagem, social, cognitivo
 * - Age-appropriate suggestions shown below milestones
 * - Uses existing DS components throughout
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, StarIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { SummaryMetricCard, SectionLabel, ChipGroup } from '@/components/ds';

type DevTab = 'overview' | 'milestones' | 'activities';

const TABS: { id: DevTab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Visão geral', Icon: SparklesIcon },
  { id: 'milestones', label: 'Marcos',      Icon: StarIcon },
  { id: 'activities', label: 'Atividades',  Icon: LightBulbIcon },
];

const GOLD = 'hsl(40,80%,52%)';
const DOMAIN_COLORS: Record<string, string> = {
  motor:     'hsl(152,15%,55%)',
  linguagem: 'hsl(200,40%,50%)',
  social:    'hsl(270,12%,52%)',
  cognitivo: 'hsl(32,80%,57%)',
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  domain: 'motor' | 'linguagem' | 'social' | 'cognitivo';
  emoji: string;
  label: string;
  description: string;
  ageHint: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getAgeMonths(birthDate: string): number {
  const diffMs = Date.now() - new Date(birthDate + 'T00:00:00').getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

function getPhaseLabel(months: number): string {
  if (months < 1)  return 'Recém-nascido';
  if (months < 3)  return 'Primeiro trimestre';
  if (months < 6)  return 'Segundo trimestre';
  if (months < 9)  return 'Terceiro trimestre';
  if (months < 12) return 'Quarto trimestre';
  if (months < 18) return '1 a 1,5 anos';
  if (months < 24) return '1,5 a 2 anos';
  return `${Math.floor(months / 12)} anos`;
}

function getMilestones(months: number): Milestone[] {
  if (months <= 2) return [
    { id: 'visual-track', domain: 'motor', emoji: '👁️', label: 'Segue objetos com olhos', description: 'Acompanha objetos a 20–30 cm', ageHint: '0–2 meses' },
    { id: 'social-smile', domain: 'social', emoji: '😄', label: 'Sorriso social', description: 'Sorri em resposta ao rosto da mãe', ageHint: '0–2 meses' },
    { id: 'vocalize', domain: 'linguagem', emoji: '🗣️', label: 'Vocaliza', description: 'Emite sons guturais e gorjeios', ageHint: '0–2 meses' },
    { id: 'head-lift', domain: 'motor', emoji: '💪', label: 'Eleva a cabeça', description: 'Levanta levemente em decúbito ventral', ageHint: '0–2 meses' },
  ];
  if (months <= 4) return [
    { id: 'head-control', domain: 'motor', emoji: '💪', label: 'Sustenta a cabeça', description: 'Por alguns segundos firme', ageHint: '3–4 meses' },
    { id: 'hands-open', domain: 'motor', emoji: '✋', label: 'Abre e fecha mãos', description: 'Coordenação motora fina inicial', ageHint: '3–4 meses' },
    { id: 'loud-laugh', domain: 'social', emoji: '😄', label: 'Ri em voz alta', description: 'Risos audíveis em interação', ageHint: '3–4 meses' },
    { id: 'babble', domain: 'linguagem', emoji: '🗣️', label: 'Balbucia', description: 'Vocaliza sílabas', ageHint: '3–4 meses' },
  ];
  if (months <= 6) return [
    { id: 'roll', domain: 'motor', emoji: '🔄', label: 'Rola supino-prono', description: 'Gira de costas para barriga', ageHint: '4–6 meses' },
    { id: 'grab', domain: 'motor', emoji: '✋', label: 'Pega com ambas mãos', description: 'Preensão bilateral de objetos', ageHint: '4–6 meses' },
    { id: 'recognizes-faces', domain: 'social', emoji: '😄', label: 'Reconhece pessoas', description: 'Reage a rostos familiares', ageHint: '4–6 meses' },
    { id: 'syllables', domain: 'linguagem', emoji: '🗣️', label: 'Produz sílabas', description: '"ba", "ma", "da"', ageHint: '5–6 meses' },
  ];
  if (months <= 12) return [
    { id: 'sit', domain: 'motor', emoji: '🧘', label: 'Senta sem apoio', description: 'Equilíbrio sentado independente', ageHint: '6–9 meses' },
    { id: 'crawl', domain: 'motor', emoji: '🐛', label: 'Engatinha', description: 'Locomoção no chão', ageHint: '8–10 meses' },
    { id: 'mama-dada', domain: 'linguagem', emoji: '🗣️', label: '"Mamã" e "papá"', description: 'Primeiras palavras com sentido', ageHint: '9–12 meses' },
    { id: 'wave', domain: 'social', emoji: '👋', label: 'Dá tchau', description: 'Gestual social intencional', ageHint: '9–12 meses' },
    { id: 'object-permanence', domain: 'cognitivo', emoji: '🧠', label: 'Permanência do objeto', description: 'Procura objeto escondido', ageHint: '8–12 meses' },
  ];
  return [
    { id: 'walk', domain: 'motor', emoji: '🚶', label: 'Anda sozinho', description: 'Passos independentes', ageHint: '11–14 meses' },
    { id: 'words', domain: 'linguagem', emoji: '🗣️', label: 'Primeiras palavras', description: '5+ palavras com significado', ageHint: '12–18 meses' },
    { id: 'play-together', domain: 'social', emoji: '🤝', label: 'Brinca com outras crianças', description: 'Interação social em jogo', ageHint: '18–24 meses' },
    { id: 'symbolic-play', domain: 'cognitivo', emoji: '🧠', label: 'Jogo simbólico', description: 'Faz de conta, imaginação', ageHint: '18–24 meses' },
  ];
}

function getActivities(months: number): { emoji: string; domain: string; title: string; description: string }[] {
  if (months <= 3) return [
    { emoji: '🎵', domain: 'linguagem', title: 'Conversar cantando', description: 'Cantar músicas de ninar estimula linguagem e conexão.' },
    { emoji: '👁️', domain: 'motor', title: 'Seguir objetos', description: 'Mova um objeto colorido lentamente para estimular rastreamento visual.' },
    { emoji: '🤱', domain: 'motor', title: 'Tempo de barriga', description: 'Coloque de bruços por alguns minutos para fortalecer pescoço.' },
  ];
  if (months <= 6) return [
    { emoji: '🔮', domain: 'cognitivo', title: 'Objetos de textura', description: 'Ofereça objetos com texturas diferentes.' },
    { emoji: '🪞', domain: 'social', title: 'Explorar o espelho', description: 'Bebês adoram explorar o próprio reflexo.' },
    { emoji: '🎵', domain: 'linguagem', title: 'Ritmo e música', description: 'Bata palmas ao ritmo de músicas.' },
  ];
  if (months <= 12) return [
    { emoji: '🏗️', domain: 'cognitivo', title: 'Empilhar blocos', description: 'Estimula coordenação e cognição.' },
    { emoji: '📚', domain: 'linguagem', title: 'Livros de imagem', description: 'Nomear figuras ajuda no desenvolvimento da linguagem.' },
    { emoji: '🎭', domain: 'social', title: 'Esconde-esconde', description: 'Estimula permanência do objeto e interação social.' },
  ];
  return [
    { emoji: '🎨', domain: 'cognitivo', title: 'Atividades criativas', description: 'Desenhar e modelar estimulam expressão.' },
    { emoji: '📚', domain: 'linguagem', title: 'Leitura conjunta', description: 'Ler juntos expande vocabulário.' },
    { emoji: '🏃', domain: 'motor', title: 'Movimento livre', description: 'Brincar ao ar livre favorece o desenvolvimento motor.' },
  ];
}

const DOMAIN_OPTIONS = [
  { value: 'all',       label: 'Todos' },
  { value: 'motor',     label: '💪 Motor' },
  { value: 'linguagem', label: '🗣️ Linguagem' },
  { value: 'social',    label: '🤝 Social' },
  { value: 'cognitivo', label: '🧠 Cognitivo' },
];

// ─── Persistence ───────────────────────────────────────────────────────────

function getMilestoneKey(childId: string) { return `ninho_milestones_${childId}`; }

function loadAchieved(childId: string): string[] {
  try { return JSON.parse(localStorage.getItem(getMilestoneKey(childId)) ?? '[]'); }
  catch { return []; }
}

function saveAchieved(childId: string, ids: string[]) {
  try { localStorage.setItem(getMilestoneKey(childId), JSON.stringify(ids)); } catch { /* noop */ }
}

// ─── Sections ──────────────────────────────────────────────────────────────

function OverviewSection() {
  const { activeChild, getAgeLabel } = useActiveChild();
  if (!activeChild) return (
    <div className="flex flex-col items-center text-center px-8 pt-12">
      <p className="text-[17px] font-bold font-quicksand text-foreground">Nenhuma criança ativa</p>
    </div>
  );

  const months = getAgeMonths(activeChild.birth_date);
  const milestones = getMilestones(months);
  const achieved = loadAchieved(activeChild.id);
  const achievedCount = achieved.filter(id => milestones.some(m => m.id === id)).length;

  const domainCounts = ['motor', 'linguagem', 'social', 'cognitivo'].map(d => ({
    domain: d,
    total: milestones.filter(m => m.domain === d).length,
    done: achieved.filter(id => milestones.find(m => m.id === id)?.domain === d).length,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">
      {/* Phase card */}
      <div className="rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${GOLD} 15%, transparent)` }}>✨</div>
          <div>
            <p className="text-[15px] font-bold font-quicksand text-foreground">{activeChild.name}</p>
            <p className="text-[13px] font-semibold font-nunito" style={{ color: GOLD }}>
              {getPhaseLabel(months)} · {getAgeLabel(activeChild.birth_date)}
            </p>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground font-nunito">
          Nesta fase, {activeChild.name} está em pleno desenvolvimento. Marque os marcos alcançados para acompanhar a progressão.
        </p>
      </div>

      {/* Progress metrics */}
      <div>
        <SectionLabel>Progresso por área</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <SummaryMetricCard
            emoji="⭐" label="Conquistados"
            value={`${achievedCount} / ${milestones.length}`}
            sub="marcos desta fase"
            accentColor={GOLD}
            empty={achievedCount === 0}
          />
          {domainCounts.slice(0, 3).map(d => (
            <SummaryMetricCard key={d.domain}
              emoji={d.domain === 'motor' ? '💪' : d.domain === 'linguagem' ? '🗣️' : d.domain === 'social' ? '🤝' : '🧠'}
              label={d.domain.charAt(0).toUpperCase() + d.domain.slice(1)}
              value={`${d.done} / ${d.total}`}
              accentColor={DOMAIN_COLORS[d.domain]}
              empty={d.done === 0}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MilestonesSection() {
  const { activeChild } = useActiveChild();
  const [domainFilter, setDomainFilter] = useState('all');
  const [achieved, setAchieved] = useState<string[]>([]);

  useEffect(() => {
    if (activeChild) setAchieved(loadAchieved(activeChild.id));
  }, [activeChild]);

  if (!activeChild) return null;

  const months = getAgeMonths(activeChild.birth_date);
  const allMilestones = getMilestones(months);
  const filtered = domainFilter === 'all' ? allMilestones : allMilestones.filter(m => m.domain === domainFilter);

  function toggleAchieved(id: string) {
    const next = achieved.includes(id) ? achieved.filter(x => x !== id) : [...achieved, id];
    setAchieved(next);
    saveAchieved(activeChild!.id, next);
  }

  const achievedCount = achieved.filter(id => allMilestones.some(m => m.id === id)).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 space-y-4 pb-6">
      {/* Progress bar */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-bold font-quicksand text-foreground">
            {achievedCount} de {allMilestones.length} marcos
          </p>
          <p className="text-[12px] font-semibold font-nunito" style={{ color: GOLD }}>
            {allMilestones.length > 0 ? Math.round(achievedCount / allMilestones.length * 100) : 0}%
          </p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: GOLD }}
            initial={{ width: 0 }}
            animate={{ width: `${allMilestones.length > 0 ? (achievedCount / allMilestones.length) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Domain filter */}
      <div>
        <SectionLabel>Filtrar por área</SectionLabel>
        <ChipGroup
          options={DOMAIN_OPTIONS}
          value={domainFilter}
          onToggle={v => setDomainFilter(v)}
          accentColor={GOLD}
        />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito">
        Esperados para esta fase
      </p>

      {/* Milestone cards */}
      <div className="space-y-2">
        {filtered.map((m, i) => {
          const done = achieved.includes(m.id);
          const domainColor = DOMAIN_COLORS[m.domain];
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggleAchieved(m.id)}
              className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98] bg-card border border-border"
              style={{
                borderColor: done ? `color-mix(in srgb, ${domainColor} 35%, transparent)` : 'hsl(var(--border))',
                backgroundColor: done ? `color-mix(in srgb, ${domainColor} 6%, hsl(var(--card)))` : 'hsl(var(--card))',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${domainColor} 14%, transparent)` }}
              >
                {done ? '✅' : m.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-[14px] font-bold font-quicksand leading-tight ${done ? '' : 'text-foreground'}`}
                    style={{ color: done ? domainColor : undefined }}>
                    {m.label}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-nunito"
                    style={{ backgroundColor: `color-mix(in srgb, ${domainColor} 12%, transparent)`, color: domainColor }}>
                    {m.ageHint}
                  </span>
                </div>
                <p className="text-[12px] mt-0.5 text-muted-foreground font-nunito leading-snug">{m.description}</p>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  borderColor: done ? domainColor : 'hsl(var(--border))',
                  backgroundColor: done ? domainColor : 'transparent',
                }}
              >
                {done && <span className="text-white text-[10px]">✓</span>}
              </div>
            </motion.button>
          );
        })}
      </div>
      <p className="text-[11px] text-center pt-1 pb-4 text-muted-foreground font-nunito">
        Baseado na escala Denver II. Cada criança tem seu próprio ritmo.
      </p>
    </motion.div>
  );
}

function ActivitiesSection() {
  const { activeChild } = useActiveChild();
  const [domainFilter, setDomainFilter] = useState('all');
  if (!activeChild) return null;

  const months = getAgeMonths(activeChild.birth_date);
  const all = getActivities(months);
  const filtered = domainFilter === 'all' ? all : all.filter(a => a.domain === domainFilter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 space-y-4 pb-6">
      <div>
        <SectionLabel>Filtrar por área</SectionLabel>
        <ChipGroup
          options={DOMAIN_OPTIONS}
          value={domainFilter}
          onToggle={v => setDomainFilter(v)}
          accentColor={GOLD}
        />
      </div>
      <SectionLabel>Sugeridas para esta fase</SectionLabel>
      <div className="space-y-2">
        {filtered.map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${DOMAIN_COLORS[a.domain] ?? GOLD} 14%, transparent)` }}>
              {a.emoji}
            </div>
            <div>
              <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">{a.title}</p>
              <p className="text-[12px] mt-0.5 text-muted-foreground font-nunito leading-snug">{a.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DesenvolvimentoPage() {
  const [activeTab, setActiveTab] = useState<DevTab>('overview');

  return (
    <div className="min-h-screen pb-28 bg-background">
      <div className="px-5 pb-5"
        style={{ paddingTop: 'max(56px, env(safe-area-inset-top))', backgroundColor: 'hsl(40,65%,45%)' }}>
        <h1 className="text-[22px] font-bold text-white font-quicksand">Crescer</h1>
        <p className="text-[13px] text-white/70 mt-0.5 font-nunito">Marcos e desenvolvimento</p>
      </div>

      <div className="flex border-b bg-card" style={{ borderColor: 'hsl(var(--border))' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold transition-colors relative font-nunito"
              style={{ color: isActive ? GOLD : 'hsl(var(--muted-foreground))' }}>
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

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === 'overview'   && <OverviewSection />}
          {activeTab === 'milestones' && <MilestonesSection />}
          {activeTab === 'activities' && <ActivitiesSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
