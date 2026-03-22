/**
 * DesenvolvimentoPage — Crescer
 *
 * Estrutura:
 *   1. Header roxo com fase atual + idade
 *   2. Card de contexto da fase (descrição educativa)
 *   3. Atividade sugerida do dia
 *   4. Marcos de desenvolvimento por categoria
 *      (Motor Grosso, Motor Fino, Linguagem, Socioafetivo)
 *   5. Conquistas registradas
 *
 * Dados:
 *   - Marcos inline (hardcoded por fase) — sem dependência de tabela
 *     milestones_catalog ainda não populada
 *   - Conquistas salvas em health_logs type='note' details.type='milestone'
 *   - Fase calculada via getAgeContext (já existe no projeto)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { getAgeContext } from '@/lib/eventSystem';
import { SectionLabel, InlineStatusPill } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// ── Cores fixas ──
const MAUVE        = '#806e84';
const MAUVE_BG     = '#f4f0f3';
const MAUVE_BORDER = '#e3d9e2';
const SAGE         = '#789687';
const SAGE_BG      = '#ebf0ed';
const SAGE_BORDER  = '#ccd9d3';
const AMBER        = '#C8894A';
const AMBER_BG     = '#FDF3E9';
const AMBER_BORDER = '#f0d5b0';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#E5E0D8';
const MUTED_BG     = '#E8E8E2';
const PAGE_BG      = '#F8F5F0';
const TXT          = '#2C2C2C';
const TXT_MUTED    = '#7A7A7A';

// ── Tipos ──
type MilestoneCategory = 'motor_grosso' | 'motor_fino' | 'linguagem' | 'socioafetivo';

interface Milestone {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  source: string;
}

interface AchievedMilestone {
  id: string;
  milestoneId: string;
  achievedAt: Date;
  notes?: string;
}

interface PhaseData {
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  activity: {
    emoji: string;
    category: string;
    title: string;
    description: string;
  };
  milestones: Milestone[];
}

// ── Configuração de categorias ──
const CATEGORY_CONFIG: Record<MilestoneCategory, { emoji: string; label: string; color: string; bg: string }> = {
  motor_grosso:  { emoji: '🤸', label: 'Motor Grosso',   color: SAGE,  bg: SAGE_BG },
  motor_fino:    { emoji: '✋', label: 'Motor Fino',      color: MAUVE, bg: MAUVE_BG },
  linguagem:     { emoji: '🗣️', label: 'Linguagem',       color: AMBER, bg: AMBER_BG },
  socioafetivo:  { emoji: '❤️', label: 'Socioafetivo',    color: '#C04A4A', bg: '#FCEAEA' },
};

// ── Dados de fases (baseados em AAP 2022 + OMS) ──
function getPhaseData(ageMonths: number): PhaseData {
  if (ageMonths < 1) return {
    emoji: '🐣',
    title: 'Recém-nascido',
    subtitle: 'Primeiras semanas de vida',
    description: 'O mundo é completamente novo. Visão, tato e olfato são os principais sentidos agora. Seu bebê reconhece sua voz — é a mais familiar de todas.',
    activity: {
      emoji: '👁️', category: 'Socioafetivo', title: 'Contato visual',
      description: 'Segure o bebê a 20–30cm do rosto e olhe nos olhos dele. Fale devagar. Ele pode focar por alguns segundos.',
    },
    milestones: [
      { id: 'rn-1', title: 'Reage a sons altos', description: 'Pisca ou se sobressalta com barulhos', category: 'linguagem', source: 'AAP 2022' },
      { id: 'rn-2', title: 'Foca rosto a 20cm', description: 'Consegue focar brevemente no rosto do cuidador', category: 'socioafetivo', source: 'OMS' },
      { id: 'rn-3', title: 'Reflexo de preensão', description: 'Fecha os dedos ao tocar a palma da mão', category: 'motor_fino', source: 'AAP 2022' },
      { id: 'rn-4', title: 'Vira a cabeça', description: 'Vira levemente para buscar a voz materna', category: 'motor_grosso', source: 'OMS' },
    ],
  };

  if (ageMonths < 3) return {
    emoji: '🌱',
    title: 'Fase de descobertas',
    subtitle: `${ageMonths} ${ageMonths === 1 ? 'mês' : 'meses'} — 0 a 3 meses`,
    description: 'O cérebro está formando milhares de conexões por segundo. Sorrisos, sons e contato visual são estímulos poderosos agora. Cada interação conta.',
    activity: {
      emoji: '🤸', category: 'Motor Grosso', title: 'Tempo de barriga',
      description: 'Coloque o bebê de bruços por 3–5 minutos. Observe se ele tenta levantar a cabeça. Fale com ele durante a atividade. Nunca deixe dormindo de bruços.',
    },
    milestones: [
      { id: '0-3-1', title: 'Levanta a cabeça de bruços', description: '75% das crianças atingem aos 2m', category: 'motor_grosso', source: 'AAP 2022' },
      { id: '0-3-2', title: 'Abre e fecha as mãos', description: 'Começa a explorar com as mãos', category: 'motor_fino', source: 'OMS' },
      { id: '0-3-3', title: 'Sorriso social', description: 'Sorri em resposta ao rosto ou voz de alguém', category: 'socioafetivo', source: 'AAP 2022' },
      { id: '0-3-4', title: 'Faz sons e gorgolejados', description: 'Responde a vozes com sons diferentes do choro', category: 'linguagem', source: 'OMS' },
      { id: '0-3-5', title: 'Segue objetos com os olhos', description: 'Acompanha um objeto em movimento de lado a lado', category: 'motor_fino', source: 'AAP 2022' },
    ],
  };

  if (ageMonths < 6) return {
    emoji: '🌟',
    title: 'Fase da exploração',
    subtitle: `${ageMonths} meses — 3 a 6 meses`,
    description: 'Tudo vai para a boca — é assim que ele aprende. Músicas, livros coloridos e espelhos são ótimos estímulos. Ele já reconhece seu rosto e sorri ao te ver.',
    activity: {
      emoji: '🪞', category: 'Socioafetivo', title: 'Espelho mágico',
      description: 'Segure o bebê na frente de um espelho. Aponte para o reflexo e diga o nome dele. Observe a reação curiosa — ele ainda não sabe que é ele!',
    },
    milestones: [
      { id: '3-6-1', title: 'Sustenta a cabeça firme', description: 'Mantém a cabeça erguida sem apoio', category: 'motor_grosso', source: 'AAP 2022' },
      { id: '3-6-2', title: 'Rola de bruços para o dorso', description: 'Consegue se virar sozinho', category: 'motor_grosso', source: 'OMS' },
      { id: '3-6-3', title: 'Segura objetos', description: 'Agarra e mantém objetos na mão', category: 'motor_fino', source: 'AAP 2022' },
      { id: '3-6-4', title: 'Gargalhadas', description: 'Ri alto em resposta a estímulos', category: 'linguagem', source: 'OMS' },
      { id: '3-6-5', title: 'Reconhece rostos familiares', description: 'Demonstra preferência por pessoas conhecidas', category: 'socioafetivo', source: 'AAP 2022' },
    ],
  };

  if (ageMonths < 9) return {
    emoji: '🚀',
    title: 'Fase da curiosidade',
    subtitle: `${ageMonths} meses — 6 a 9 meses`,
    description: 'A mobilidade está chegando. Sentar, engatinhar, explorar. Introdução alimentar começa nessa fase — cada novo sabor é uma aventura. A ansiedade de separação também aparece.',
    activity: {
      emoji: '🎵', category: 'Linguagem', title: 'Canções com movimentos',
      description: 'Cante músicas simples com gestos (bater palma, balançar). Repita a mesma música todos os dias. A antecipação dos gestos é um grande estímulo cognitivo.',
    },
    milestones: [
      { id: '6-9-1', title: 'Senta com apoio', description: 'Mantém postura sentada com suporte leve', category: 'motor_grosso', source: 'AAP 2022' },
      { id: '6-9-2', title: 'Transfere objetos entre as mãos', description: 'Passa um brinquedo de uma mão para a outra', category: 'motor_fino', source: 'OMS' },
      { id: '6-9-3', title: 'Balbucia sílabas', description: 'Produz sons como "ba", "da", "ma"', category: 'linguagem', source: 'AAP 2022' },
      { id: '6-9-4', title: 'Responde ao próprio nome', description: 'Vira a cabeça quando chamado', category: 'socioafetivo', source: 'OMS' },
      { id: '6-9-5', title: 'Ansiedade de separação', description: 'Chora ou fica agitado quando cuidador sai', category: 'socioafetivo', source: 'AAP 2022' },
    ],
  };

  if (ageMonths < 12) return {
    emoji: '🏃',
    title: 'Fase do movimento',
    subtitle: `${ageMonths} meses — 9 a 12 meses`,
    description: 'Engatinhar, se levantar, dar os primeiros passos. A comunicação avança rápido — ele já entende muito mais do que fala. As primeiras palavras estão chegando.',
    activity: {
      emoji: '📦', category: 'Motor Fino', title: 'Jogo de encaixe',
      description: 'Ofereça potes com tampas ou brinquedos de encaixe simples. Tirar e colocar desenvolve coordenação e causa-efeito. Celebre cada tentativa!',
    },
    milestones: [
      { id: '9-12-1', title: 'Senta sem apoio', description: 'Mantém postura sentada de forma independente', category: 'motor_grosso', source: 'AAP 2022' },
      { id: '9-12-2', title: 'Pinça — polegar e indicador', description: 'Pega objetos pequenos com dois dedos', category: 'motor_fino', source: 'OMS' },
      { id: '9-12-3', title: 'Primeiras palavras', description: '"Mamã", "papá" com significado', category: 'linguagem', source: 'AAP 2022' },
      { id: '9-12-4', title: 'Imita gestos', description: 'Acena tchau, bate palmas imitando adultos', category: 'socioafetivo', source: 'OMS' },
      { id: '9-12-5', title: 'Fica em pé com apoio', description: 'Se levanta segurando em móveis', category: 'motor_grosso', source: 'AAP 2022' },
    ],
  };

  if (ageMonths < 18) return {
    emoji: '👶',
    title: 'Primeiros passos',
    subtitle: `${ageMonths} meses — 12 a 18 meses`,
    description: 'Os primeiros passos independentes chegam! O vocabulário cresce rapidamente. A autonomia aumenta — junto com a birra. É tudo desenvolvimento normal.',
    activity: {
      emoji: '📚', category: 'Linguagem', title: 'Leitura compartilhada',
      description: 'Leia livros com imagens grandes e cores. Aponte para os objetos e nomeie. Deixe que ele vire as páginas. 15 minutos por dia faz grande diferença no vocabulário.',
    },
    milestones: [
      { id: '12-18-1', title: 'Caminha sozinho', description: 'Primeiros passos sem apoio', category: 'motor_grosso', source: 'AAP 2022' },
      { id: '12-18-2', title: 'Empilha 2 blocos', description: 'Consegue empilhar objetos um sobre o outro', category: 'motor_fino', source: 'OMS' },
      { id: '12-18-3', title: 'Vocabulário de 5–10 palavras', description: 'Usa palavras com significado consistente', category: 'linguagem', source: 'AAP 2022' },
      { id: '12-18-4', title: 'Jogo simbólico inicial', description: 'Faz de conta com brinquedos (ex: coloca colher na boneca)', category: 'socioafetivo', source: 'OMS' },
      { id: '12-18-5', title: 'Aponta para pedir', description: 'Usa o dedo indicador para mostrar o que quer', category: 'linguagem', source: 'AAP 2022' },
    ],
  };

  if (ageMonths < 24) return {
    emoji: '🌈',
    title: 'Fase da linguagem',
    subtitle: `${ageMonths} meses — 18 a 24 meses`,
    description: 'Explosão de linguagem! As palavras e frases curtas aparecem rapidamente. A criança começa a entender regras sociais simples e a brincar com outras crianças.',
    activity: {
      emoji: '🎨', category: 'Motor Fino', title: 'Rabiscos livres',
      description: 'Ofereça papel grande e giz de cera grosso. Deixe rabiscar livremente sem julgamento. O processo é mais importante que o resultado. Fala sobre as cores.',
    },
    milestones: [
      { id: '18-24-1', title: 'Corre com equilíbrio', description: 'Corre sem cair com frequência', category: 'motor_grosso', source: 'AAP 2022' },
      { id: '18-24-2', title: 'Frases de 2 palavras', description: '"Quer água", "papai foi"', category: 'linguagem', source: 'OMS' },
      { id: '18-24-3', title: 'Jogo paralelo', description: 'Brinca ao lado de outras crianças (ainda não junto)', category: 'socioafetivo', source: 'AAP 2022' },
      { id: '18-24-4', title: 'Segue instruções simples', description: 'Entende "pega o sapato" sem gestos', category: 'linguagem', source: 'OMS' },
      { id: '18-24-5', title: 'Torre de 6 blocos', description: 'Empilha vários objetos com controle', category: 'motor_fino', source: 'AAP 2022' },
    ],
  };

  return {
    emoji: '🦋',
    title: 'Fase da independência',
    subtitle: `${ageMonths} meses — acima de 2 anos`,
    description: 'A personalidade se consolida. Autonomia, criatividade e socialização são os focos. Birras ainda aparecem — é a criança testando limites. Paciência e consistência são os melhores aliados.',
    activity: {
      emoji: '🧩', category: 'Cognitivo', title: 'Quebra-cabeça simples',
      description: 'Ofereça quebra-cabeças de 4–8 peças grandes. Comece mostrando como encaixar uma peça. Deixe que ele resolva sozinho. Valorize o esforço, não só o resultado.',
    },
    milestones: [
      { id: '24+-1', title: 'Sobe escadas alternando os pés', description: 'Sobe e desce com equilíbrio', category: 'motor_grosso', source: 'AAP 2022' },
      { id: '24+-2', title: 'Frases de 3+ palavras', description: 'Frases com sujeito, verbo e complemento', category: 'linguagem', source: 'OMS' },
      { id: '24+-3', title: 'Jogo simbólico elaborado', description: 'Cria histórias com brinquedos', category: 'socioafetivo', source: 'AAP 2022' },
      { id: '24+-4', title: 'Recorta com tesoura', description: 'Controle refinado de tesoura com ponta arredondada', category: 'motor_fino', source: 'OMS' },
      { id: '24+-5', title: 'Reconhece emoções', description: 'Nomeia "feliz", "triste", "com medo"', category: 'socioafetivo', source: 'AAP 2022' },
    ],
  };
}

// ── Modal de registro de marco ──
function MilestoneModal({
  milestone,
  childId,
  userId,
  onClose,
  onSaved,
}: {
  milestone: Milestone;
  childId: string;
  userId: string;
  onClose: () => void;
  onSaved: (achieved: AchievedMilestone) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]   = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const cat = CATEGORY_CONFIG[milestone.category];

  async function confirm() {
    setSaving(true);
    try {
      const { data, error } = await supabase.from('health_logs').insert({
        child_id:    childId,
        author_id:   userId,
        type:        'note',
        occurred_at: new Date(date + 'T12:00:00').toISOString(),
        details: {
          type:           'milestone',
          milestone_id:   milestone.id,
          milestone_title: milestone.title,
          category:       milestone.category,
          notes:          notes.trim() || null,
          achieved_on:    date,
        },
      }).select('id').single();
      if (error) throw error;
      onSaved({ id: data.id, milestoneId: milestone.id, achievedAt: new Date(date + 'T12:00:00'), notes: notes.trim() || undefined });
      toast({ title: `🎉 Marco registrado!`, description: milestone.title });
      onClose();
    } catch {
      toast({ title: 'Erro ao registrar marco', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: CARD_BG }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: CARD_BORDER }} />
        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>
                Registrar marco 🎉
              </p>
              <p className="text-[12px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                {milestone.title}
              </p>
            </div>
            <button onClick={onClose} style={{ color: TXT_MUTED }}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: cat.bg, border: `1px solid ${CARD_BORDER}` }}>
            <span className="text-[20px]">{cat.emoji}</span>
            <div>
              <p className="text-[11px] font-bold font-nunito uppercase tracking-wide" style={{ color: TXT_MUTED }}>
                {cat.label}
              </p>
              <p className="text-[13px] font-nunito leading-snug" style={{ color: TXT }}>
                {milestone.description}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-2" style={{ color: TXT_MUTED }}>
              Quando aconteceu?
            </p>
            <input type="date" value={date} max={today}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito outline-none"
              style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
            />
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-2" style={{ color: TXT_MUTED }}>
              Como foi? (opcional)
            </p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ex: começou a levantar a cabeça durante o tummy time..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito resize-none outline-none"
              style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{ backgroundColor: MUTED_BG, color: TXT_MUTED, border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={confirm} disabled={saving}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Salvando…' : '🎉 Confirmar marco'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Milestone row ──
function MilestoneRow({
  milestone,
  achieved,
  onRegister,
}: {
  milestone: Milestone;
  achieved?: AchievedMilestone;
  onRegister: (m: Milestone) => void;
}) {
  const cat = CATEGORY_CONFIG[milestone.category];
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all"
      style={{
        backgroundColor: achieved ? cat.bg : CARD_BG,
        border: `1px solid ${achieved ? CARD_BORDER : CARD_BORDER}`,
        opacity: achieved ? 0.9 : 1,
      }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0 mt-0.5"
        style={{ backgroundColor: achieved ? cat.color : MUTED_BG }}>
        {achieved ? '✓' : cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
          {milestone.title}
        </p>
        <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>
          {milestone.description}
        </p>
        {achieved && (
          <p className="text-[10px] font-bold font-nunito mt-1" style={{ color: cat.color }}>
            ✓ Registrado em {achieved.achievedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </p>
        )}
        <p className="text-[9px] font-nunito mt-0.5" style={{ color: '#CBCBC8' }}>
          Fonte: {milestone.source}
        </p>
      </div>
      {!achieved && (
        <button onClick={() => onRegister(milestone)}
          className="text-[10px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 self-center transition-all active:scale-95"
          style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
          Atingido
        </button>
      )}
    </div>
  );
}

// ── Main Page ──
export default function DesenvolvimentoPage() {
  const { user }        = useAuth();
  const { activeChild } = useActiveChild();

  const ageCtx    = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const ageMonths = ageCtx?.months ?? 0;
  const phase     = getPhaseData(ageMonths);
  const childName = activeChild?.name ?? 'seu filho';

  const [achieved, setAchieved]         = useState<AchievedMilestone[]>([]);
  const [loading, setLoading]           = useState(true);
  const [confirmMilestone, setConfirmMilestone] = useState<Milestone | null>(null);
  const [activityDone, setActivityDone] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<MilestoneCategory>>(
    new Set(['motor_grosso', 'linguagem'])
  );

  function toggleCat(cat: MilestoneCategory) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  }

  const loadAchieved = useCallback(async () => {
    if (!activeChild) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase.from('health_logs')
        .select('*').eq('child_id', activeChild.id)
        .eq('type', 'note').order('occurred_at', { ascending: false }).limit(200);

      const list: AchievedMilestone[] = [];
      for (const row of (data ?? [])) {
        const d = (row.details ?? {}) as Record<string, unknown>;
        if (d.type === 'milestone' && typeof d.milestone_id === 'string') {
          list.push({
            id:          row.id,
            milestoneId: d.milestone_id,
            achievedAt:  new Date(row.occurred_at),
            notes:       typeof d.notes === 'string' ? d.notes : undefined,
          });
        }
      }
      setAchieved(list);
    } finally {
      setLoading(false);
    }
  }, [activeChild]);

  useEffect(() => { loadAchieved(); }, [loadAchieved]);

  // Agrupa marcos por categoria
  const milestonesByCategory = phase.milestones.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<MilestoneCategory, Milestone[]>);

  const achievedIds = new Set(achieved.map(a => a.milestoneId));
  const achievedCount = phase.milestones.filter(m => achievedIds.has(m.id)).length;
  const totalCount    = phase.milestones.length;
  const progressPct   = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  const categories = Object.keys(milestonesByCategory) as MilestoneCategory[];

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: PAGE_BG }}>

      {/* HEADER */}
      <div className="px-5 pb-5 flex-shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          backgroundColor: MAUVE,
          borderRadius: '0 0 24px 24px',
        }}
      >
        <h1 className="text-[22px] font-bold font-quicksand" style={{ color: 'white' }}>
          Crescer
        </h1>
        <p className="text-[13px] mt-0.5 font-nunito" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {activeChild ? childName : 'Desenvolvimento'}
          {ageCtx && <span style={{ opacity: 0.75 }}> · {ageCtx.phaseHint}</span>}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* FASE ATUAL */}
        <div className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] flex-shrink-0"
              style={{ backgroundColor: MAUVE_BG }}>
              {phase.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>
                {phase.title}
              </p>
              <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                {phase.subtitle}
              </p>
            </div>
          </div>

          <p className="text-[13px] font-nunito leading-relaxed" style={{ color: '#4b4b47' }}>
            {phase.description}
          </p>

          {/* Barra de progresso dos marcos */}
          {!loading && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-bold font-nunito uppercase tracking-wide" style={{ color: TXT_MUTED }}>
                  Marcos desta fase
                </p>
                <p className="text-[11px] font-bold font-nunito" style={{ color: achievedCount > 0 ? SAGE : TXT_MUTED }}>
                  {achievedCount}/{totalCount}
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: MUTED_BG }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: progressPct === 100 ? SAGE : MAUVE }}
                />
              </div>
              {progressPct === 100 && (
                <p className="text-[11px] font-bold font-nunito mt-1.5" style={{ color: SAGE }}>
                  🎉 Todos os marcos desta fase registrados!
                </p>
              )}
            </div>
          )}
        </div>

        {/* ATIVIDADE SUGERIDA */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito" style={{ color: TXT_MUTED }}>
            Atividade sugerida hoje
          </p>
          <div className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: activityDone ? SAGE_BG : AMBER_BG, border: `1px solid ${activityDone ? SAGE_BORDER : AMBER_BORDER}` }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                style={{ backgroundColor: activityDone ? SAGE_BG : AMBER_BG, border: `1px solid ${activityDone ? SAGE_BORDER : AMBER_BORDER}` }}>
                {phase.activity.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>
                    {phase.activity.title}
                  </p>
                  <span className="text-[10px] font-bold font-nunito px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: activityDone ? SAGE_BG : AMBER_BG, color: activityDone ? SAGE : AMBER, border: `1px solid ${activityDone ? SAGE_BORDER : AMBER_BORDER}` }}>
                    {phase.activity.category}
                  </span>
                </div>
                <p className="text-[12px] font-nunito leading-relaxed" style={{ color: TXT_MUTED }}>
                  {phase.activity.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActivityDone(v => !v)}
              className="w-full py-2.5 rounded-xl text-[12px] font-bold font-nunito transition-all active:scale-95"
              style={{
                backgroundColor: activityDone ? SAGE : 'white',
                color: activityDone ? 'white' : AMBER,
                border: `1.5px solid ${activityDone ? SAGE : AMBER_BORDER}`,
                cursor: 'pointer',
              }}>
              {activityDone ? '✓ Atividade feita hoje!' : 'Marcar como feita hoje'}
            </button>
          </div>
        </div>

        {/* MARCOS DE DESENVOLVIMENTO */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito" style={{ color: TXT_MUTED }}>
            Marcos de desenvolvimento
          </p>

          {loading ? (
            <div className="space-y-3">
              {[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Info box */}
              <div className="rounded-xl px-3 py-2.5 flex items-start gap-2" style={{ backgroundColor: MUTED_BG }}>
                <span className="text-[13px] mt-0.5 flex-shrink-0">ℹ️</span>
                <p className="text-[11px] font-nunito leading-snug" style={{ color: TXT_MUTED }}>
                  Marcos são referências, não obrigações. Cada criança se desenvolve no seu ritmo. Consulte o pediatra se tiver dúvidas.
                </p>
              </div>

              {categories.map(cat => {
                const catConfig = CATEGORY_CONFIG[cat];
                const catMilestones = milestonesByCategory[cat] ?? [];
                const catAchieved  = catMilestones.filter(m => achievedIds.has(m.id)).length;
                const isExpanded   = expandedCats.has(cat);

                return (
                  <div key={cat} className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <button onClick={() => toggleCat(cat)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                      style={{ backgroundColor: isExpanded ? MAUVE_BG : 'transparent' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0"
                        style={{ backgroundColor: catConfig.bg }}>
                        {catConfig.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                          {catConfig.label}
                        </p>
                        <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                          {catAchieved}/{catMilestones.length} registrados
                        </p>
                      </div>
                      {catAchieved === catMilestones.length && catMilestones.length > 0 && (
                        <InlineStatusPill label="Completo" variant="active" color={SAGE} />
                      )}
                      <span className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-2 space-y-2"
                            style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                            {catMilestones.map(m => (
                              <MilestoneRow
                                key={m.id}
                                milestone={m}
                                achieved={achieved.find(a => a.milestoneId === m.id)}
                                onRegister={setConfirmMilestone}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CONQUISTAS REGISTRADAS */}
        {achieved.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito" style={{ color: TXT_MUTED }}>
              Conquistas de {childName}
            </p>
            <div className="space-y-2">
              {achieved.slice(0, 5).map(a => {
                const milestone = phase.milestones.find(m => m.id === a.milestoneId);
                if (!milestone) return null;
                const cat = CATEGORY_CONFIG[milestone.category];
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ backgroundColor: cat.bg, border: `1px solid ${CARD_BORDER}` }}>
                    <span className="text-[18px] flex-shrink-0">🎉</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                        {milestone.title}
                      </p>
                      <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                        {a.achievedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                        {a.notes ? ` · ${a.notes}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold font-nunito px-2 py-1 rounded-full"
                      style={{ backgroundColor: CARD_BG, color: cat.color }}>
                      {cat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && achieved.length === 0 && (
          <div className="rounded-2xl px-5 py-8 text-center"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>
              Nenhum marco registrado ainda
            </p>
            <p className="text-[12px] mt-1.5 font-nunito leading-snug max-w-[220px] mx-auto" style={{ color: TXT_MUTED }}>
              Quando {childName} atingir um marco, toque em "Atingido" para registrar e guardar a memória.
            </p>
          </div>
        )}

      </div>

      {/* Modal */}
      <AnimatePresence>
        {confirmMilestone && activeChild && user && (
          <MilestoneModal
            milestone={confirmMilestone}
            childId={activeChild.id}
            userId={user.id}
            onClose={() => setConfirmMilestone(null)}
            onSaved={a => {
              setAchieved(prev => [a, ...prev]);
              setConfirmMilestone(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}