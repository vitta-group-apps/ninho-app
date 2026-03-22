/**
 * FamiliaPage — Vertical coordination hub (no horizontal tabs).
 *
 * Sections (all vertical, scrollable):
 *  1. Family identity card (name + stats)
 *  2. Children — detailed health profile cards
 *  3. Caregivers — roles + invite
 *  4. Recent activity (max 3, lightweight preview)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildAvatar } from '@/components/home/ChildSwitcher';
import { EventCard } from '@/components/events/EventCard';
import { InlineStatusPill, SectionLabel } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoutineLog } from '@/lib/eventSystem';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// ── Cores fixas do design system ──
const SAGE         = '#789687';
const SAGE_BG      = '#ebf0ed';
const SAGE_BORDER  = '#ccd9d3';
const MAUVE        = '#806e84';
const MAUVE_BG     = '#f4f0f3';
const AMBER        = '#C8894A';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#E5E0D8';
const MUTED_BG     = '#E8E8E2';
const MUTED_BG2    = '#F4F0F3';
const TXT          = '#2C2C2C';
const TXT_MUTED    = '#7A7A7A';
const PAGE_BG      = '#F8F5F0';
const EARTH        = '#7e553d';
const EARTH_BG     = '#f5efe9';

interface Member {
  id: string; user_id: string; role: string; invited_email: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin:   'Administrador',
  monitor: 'Cuidador',
  viewer:  'Observador',
};

const ROLE_COLOR: Record<string, string> = {
  admin:   MAUVE,
  monitor: SAGE,
  viewer:  TXT_MUTED,
};

function fmtWeight(w: number): string {
  if (w >= 1000) return `${(w / 1000).toFixed(2)} kg`;
  return `${w} kg`;
}

function ExpandBlock({
  title, emoji, open, onToggle, children, badge,
}: {
  title: string; emoji: string; open: boolean; onToggle: () => void;
  children: React.ReactNode; badge?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? MUTED_BG2 : 'transparent' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
          style={{ backgroundColor: MUTED_BG }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>{title}</p>
          {badge && (
            <span className="text-[10px] font-bold font-nunito px-2 py-0.5 rounded-full"
              style={{ backgroundColor: SAGE_BG, color: SAGE }}>
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronDownIcon className="w-4 h-4 flex-shrink-0" style={{ color: TXT_MUTED }} />
          : <ChevronRightIcon className="w-4 h-4 flex-shrink-0" style={{ color: TXT_MUTED }} />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden">
            <div className="px-4 pb-5 pt-3 space-y-3"
              style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FamiliaPage() {
  const navigate = useNavigate();
  const { children, familyId, getAgeLabel } = useActiveChild();

  const [familyName, setFamilyName]   = useState<string | null>(null);
  const [members, setMembers]         = useState<Member[]>([]);
  const [recentLogs, setRecentLogs]   = useState<RoutineLog[]>([]);
  const [loading, setLoading]         = useState(true);
  const [growthMap, setGrowthMap]     = useState<Record<string, { weight?: number; height?: number; date: Date }>>({});
  const [openSection, setOpenSection] = useState<'children' | 'members' | 'activity' | null>('children');

  useEffect(() => {
    if (!children.length) return;
    const ids = children.map(c => c.id);
    supabase.from('health_logs').select('child_id, details, occurred_at')
      .in('child_id', ids).eq('type', 'note')
      .order('occurred_at', { ascending: false }).limit(200)
      .then(({ data }) => {
        const map: Record<string, { weight?: number; height?: number; date: Date }> = {};
        for (const row of data ?? []) {
          const d = (row.details ?? {}) as Record<string, unknown>;
          if (d.type === 'growth' && !map[row.child_id]) {
            map[row.child_id] = {
              weight: typeof d.weight_kg === 'number' ? d.weight_kg : undefined,
              height: typeof d.height_cm === 'number' ? d.height_cm : undefined,
              date: new Date(row.occurred_at),
            };
          }
        }
        setGrowthMap(map);
      });
  }, [children]);

  const loadAll = useCallback(async () => {
    if (!familyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [famRes, memRes] = await Promise.all([
        supabase.from('families').select('name').eq('id', familyId).maybeSingle(),
        supabase.from('memberships').select('id, user_id, role, invited_email').eq('family_id', familyId).order('created_at'),
      ]);
      setFamilyName(famRes.data?.name ?? null);
      setMembers((memRes.data ?? []) as Member[]);
      if (children.length) {
        const { data } = await supabase.from('routine_logs').select('*')
          .in('child_id', children.map(c => c.id))
          .order('start_time', { ascending: false }).limit(3);
        setRecentLogs(data ?? []);
      }
    } finally { setLoading(false); }
  }, [familyId, children]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function toggle(id: 'children' | 'members' | 'activity') {
    setOpenSection(prev => prev === id ? null : id);
  }

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
        <h1 className="text-[22px] font-bold font-quicksand" style={{ color: 'white' }}>Família</h1>
        <p className="text-[13px] mt-0.5 font-nunito" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {familyName ?? 'Cuidadores e crianças'}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-4 pt-5 space-y-4 pb-6"
      >
        {/* Identity card */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: EARTH_BG }}>
              🏠
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold font-quicksand truncate" style={{ color: TXT }}>
                {familyName ?? 'Nossa família'}
              </p>
              <p className="text-[12px] font-nunito" style={{ color: TXT_MUTED }}>Família no Ninho</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: children.length, label: `Criança${children.length !== 1 ? 's' : ''}`, color: EARTH },
              { value: members.length, label: `Cuidador${members.length !== 1 ? 'es' : ''}`, color: SAGE },
              { value: recentLogs.length, label: 'Recentes', color: MAUVE },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl py-3 text-center" style={{ backgroundColor: MUTED_BG }}>
                <p className="text-[20px] font-bold font-quicksand" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* CRIANÇAS */}
            <ExpandBlock title="Crianças" emoji="👶"
              open={openSection === 'children'} onToggle={() => toggle('children')}
              badge={children.length > 0 ? String(children.length) : undefined}
            >
              {children.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>Nenhuma criança cadastrada</p>
                  <p className="text-[12px] mt-1 font-nunito" style={{ color: TXT_MUTED }}>Complete o onboarding para adicionar uma criança.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map(child => {
                    const g = growthMap[child.id];
                    return (
                      <div key={child.id} className="rounded-2xl p-4"
                        style={{ backgroundColor: PAGE_BG, border: `1px solid ${CARD_BORDER}` }}>
                        <div className="flex items-center gap-3 mb-3">
                          <ChildAvatar child={child} size={48} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold font-quicksand" style={{ color: TXT }}>{child.name}</p>
                            <p className="text-[12px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                              {getAgeLabel(child.birth_date)}
                              {child.sex && ` · ${child.sex === 'male' || child.sex === 'M' ? '♂' : '♀'}`}
                            </p>
                          </div>
                          {child.blood_type && (
                            <InlineStatusPill label={child.blood_type} variant="info" color={MAUVE} />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: MUTED_BG }}>
                            <p className="font-nunito" style={{ color: TXT_MUTED }}>Nascimento</p>
                            <p className="font-bold font-quicksand mt-0.5" style={{ color: TXT }}>
                              {new Date(child.birth_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: MUTED_BG }}>
                            <p className="font-nunito" style={{ color: TXT_MUTED }}>Tipo sanguíneo</p>
                            <p className="font-bold font-quicksand mt-0.5" style={{ color: child.blood_type ? TXT : TXT_MUTED }}>
                              {child.blood_type ?? 'Não informado'}
                            </p>
                          </div>

                          {g?.weight && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: MUTED_BG }}>
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>Último peso</p>
                              <p className="font-bold font-quicksand mt-0.5" style={{ color: SAGE }}>{fmtWeight(g.weight)}</p>
                            </div>
                          )}

                          {g?.height && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: MUTED_BG }}>
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>Última altura</p>
                              <p className="font-bold font-quicksand mt-0.5" style={{ color: MAUVE }}>{g.height} cm</p>
                            </div>
                          )}

                          {child.pediatrician && (
                            <div className="rounded-xl px-3 py-2 col-span-2" style={{ backgroundColor: MUTED_BG }}>
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>Pediatra</p>
                              <p className="font-bold font-quicksand mt-0.5 truncate" style={{ color: TXT }}>{child.pediatrician}</p>
                            </div>
                          )}

                          {child.premature && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: MUTED_BG }}>
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>Prematuro</p>
                              <p className="font-bold font-quicksand mt-0.5" style={{ color: TXT }}>
                                {child.gestational_age_w ? `${child.gestational_age_w} sem.` : 'Sim'}
                              </p>
                            </div>
                          )}

                          {child.health_plan && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: MUTED_BG }}>
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>Plano de saúde</p>
                              <p className="font-bold font-quicksand mt-0.5 truncate" style={{ color: TXT }}>{child.health_plan}</p>
                            </div>
                          )}
                        </div>

                        <button onClick={() => navigate('/health')}
                          className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold font-nunito transition-all active:scale-95"
                          style={{ backgroundColor: SAGE_BG, color: SAGE, border: `1px solid ${SAGE_BORDER}`, cursor: 'pointer' }}>
                          Ver perfil de saúde
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ExpandBlock>

            {/* CUIDADORES */}
            <ExpandBlock title="Cuidadores" emoji="🤝"
              open={openSection === 'members'} onToggle={() => toggle('members')}
              badge={members.length > 0 ? String(members.length) : undefined}
            >
              <div className="rounded-xl px-3 py-2.5 space-y-1.5" style={{ backgroundColor: MUTED_BG }}>
                {Object.entries(ROLE_LABEL).map(([role, label]) => (
                  <div key={role} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ROLE_COLOR[role] }} />
                    <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                      <span className="font-bold" style={{ color: TXT }}>{label}</span>
                      {' — '}
                      {role === 'admin' ? 'acesso total' : role === 'monitor' ? 'pode registrar eventos' : 'somente visualizar'}
                    </p>
                  </div>
                ))}
              </div>

              {members.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>Nenhum cuidador ainda</p>
                  <p className="text-[11px] mt-0.5 font-nunito" style={{ color: TXT_MUTED }}>
                    Convide familiares para acompanhar juntos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                      style={{ backgroundColor: PAGE_BG, border: `1px solid ${CARD_BORDER}` }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: MUTED_BG }}>
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold font-quicksand truncate" style={{ color: TXT }}>
                          {m.invited_email ?? 'Cuidador'}
                        </p>
                      </div>
                      <InlineStatusPill
                        label={ROLE_LABEL[m.role] ?? m.role}
                        variant="info"
                        color={ROLE_COLOR[m.role] ?? TXT_MUTED}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Convidar */}
              <div className="flex items-center gap-3 px-4 py-4 rounded-2xl"
                style={{ backgroundColor: SAGE_BG, border: `1px solid ${SAGE_BORDER}` }}>
                <span className="text-[22px]">✉️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>Convidar cuidador</p>
                  <p className="text-[11px] mt-0.5 font-nunito leading-snug" style={{ color: TXT_MUTED }}>
                    Compartilhe com parceiro, avós ou babá para coordenar o cuidado.
                  </p>
                </div>
                <div className="rounded-xl px-3 py-1.5 text-[11px] font-bold font-nunito flex-shrink-0"
                  style={{ backgroundColor: MUTED_BG, color: TXT_MUTED }}>
                  Em breve
                </div>
              </div>
            </ExpandBlock>

            {/* ATIVIDADE RECENTE */}
            <ExpandBlock title="Atividade recente" emoji="📋"
              open={openSection === 'activity'} onToggle={() => toggle('activity')}
            >
              {recentLogs.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>Nenhum evento ainda</p>
                  <p className="text-[12px] mt-1 font-nunito" style={{ color: TXT_MUTED }}>
                    Os registros da família aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div>
                  {recentLogs.map((log, idx) => {
                    const child = children.find(c => c.id === log.child_id);
                    return (
                      <EventCard key={log.id} log={log} isLast={idx === recentLogs.length - 1} authorLabel={child?.name} />
                    );
                  })}
                  <button onClick={() => navigate('/routine')}
                    className="w-full py-3 text-[12px] font-semibold font-nunito text-center rounded-2xl mt-1 transition-colors"
                    style={{ color: TXT_MUTED, backgroundColor: MUTED_BG, border: 'none', cursor: 'pointer' }}>
                    Ver toda a rotina →
                  </button>
                </div>
              )}
            </ExpandBlock>
          </>
        )}
      </motion.div>
    </div>
  );
}
