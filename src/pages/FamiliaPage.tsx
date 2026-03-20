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
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildAvatar } from '@/components/home/ChildSwitcher';
import { EventCard } from '@/components/events/EventCard';
import { InlineStatusPill, SectionLabel } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoutineLog } from '@/lib/eventSystem';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AnimatePresence } from 'framer-motion';

interface Member { id: string; user_id: string; role: string; invited_email: string | null; }

const ROLE_LABEL: Record<string, string> = {
  admin:   'Administrador',
  monitor: 'Cuidador',
  viewer:  'Observador',
};

const ROLE_COLOR: Record<string, string> = {
  admin:   'hsl(270,12%,42%)',
  monitor: 'hsl(152,15%,55%)',
  viewer:  'hsl(var(--muted-foreground))',
};

const SAGE  = 'hsl(152,15%,50%)';
const MAUVE = 'hsl(270,12%,42%)';
const BROWN = 'hsl(var(--ninho-brown))';

function fmtWeight(w: number): string {
  if (w >= 1000) return `${(w / 1000).toFixed(2)} kg`;
  return `${w} kg`;
}

// ─── Expandable section wrapper ──────────────────────────────────────────────

function ExpandBlock({
  title, emoji, open, onToggle, children, badge,
}: {
  title: string; emoji: string; open: boolean; onToggle: () => void;
  children: React.ReactNode; badge?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? 'hsl(var(--muted) / 0.5)' : 'transparent' }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
          style={{ backgroundColor: 'hsl(var(--muted))' }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className="text-[14px] font-bold font-quicksand text-foreground">{title}</p>
          {badge && (
            <span className="text-[10px] font-bold font-nunito px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `color-mix(in srgb, ${SAGE} 14%, transparent)`, color: SAGE }}>
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-3 space-y-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FamiliaPage() {
  const navigate = useNavigate();
  const { children, familyId, getAgeLabel } = useActiveChild();

  const [familyName, setFamilyName] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [recentLogs, setRecentLogs] = useState<RoutineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [growthMap, setGrowthMap] = useState<Record<string, { weight?: number; height?: number; date: Date }>>({});

  const [openSection, setOpenSection] = useState<'children' | 'members' | 'activity' | null>('children');

  // Child health data
  useEffect(() => {
    if (!children.length) return;
    // Load latest growth for each child
    const ids = children.map(c => c.id);
    supabase.from('health_logs')
      .select('child_id, details, occurred_at')
      .in('child_id', ids)
      .eq('type', 'note')
      .order('occurred_at', { ascending: false })
      .limit(200)
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
        const { data } = await supabase.from('routine_logs')
          .select('*')
          .in('child_id', children.map(c => c.id))
          .order('start_time', { ascending: false })
          .limit(3);
        setRecentLogs(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [familyId, children]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function toggle(id: 'children' | 'members' | 'activity') {
    setOpenSection(prev => prev === id ? null : id);
  }

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{ paddingTop: 'max(56px, env(safe-area-inset-top))', backgroundColor: 'hsl(16,14%,32%)' }}
      >
        <h1 className="text-[22px] font-bold text-white font-quicksand">Família</h1>
        <p className="text-[13px] text-white/70 mt-0.5 font-nunito">
          {familyName ?? 'Cuidadores e crianças'}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-4 pt-5 space-y-4 pb-6"
      >
        {/* ── Family identity card ───────────────────────────────────── */}
        <div className="rounded-2xl p-4 bg-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `color-mix(in srgb, ${BROWN} 10%, transparent)` }}>
              🏠
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold font-quicksand text-foreground truncate">
                {familyName ?? 'Nossa família'}
              </p>
              <p className="text-[12px] text-muted-foreground font-nunito">Família no Ninho</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl py-3 text-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-[20px] font-bold font-quicksand" style={{ color: BROWN }}>
                {children.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-nunito mt-0.5">
                Criança{children.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="rounded-xl py-3 text-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-[20px] font-bold font-quicksand" style={{ color: SAGE }}>
                {members.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-nunito mt-0.5">
                Cuidador{members.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <div className="rounded-xl py-3 text-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-[20px] font-bold font-quicksand" style={{ color: MAUVE }}>
                {recentLogs.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-nunito mt-0.5">
                Recentes
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* ── Children section ─────────────────────────────────── */}
            <ExpandBlock
              title="Crianças"
              emoji="👶"
              open={openSection === 'children'}
              onToggle={() => toggle('children')}
              badge={children.length > 0 ? String(children.length) : undefined}
            >
              {children.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[14px] font-bold font-quicksand text-foreground">Nenhuma criança cadastrada</p>
                  <p className="text-[12px] mt-1 text-muted-foreground font-nunito">Complete o onboarding para adicionar uma criança.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map(child => {
                    const g = growthMap[child.id];
                    return (
                      <div key={child.id} className="rounded-2xl p-4 bg-background border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <ChildAvatar child={child} size={48} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold font-quicksand text-foreground">{child.name}</p>
                            <p className="text-[12px] text-muted-foreground font-nunito mt-0.5">
                              {getAgeLabel(child.birth_date)}
                              {child.sex && ` · ${child.sex === 'male' || child.sex === 'M' ? '♂' : '♀'}`}
                            </p>
                          </div>
                          {child.blood_type && (
                            <InlineStatusPill label={child.blood_type} variant="info" color={MAUVE} />
                          )}
                        </div>

                        {/* Health identity details */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                            <p className="text-muted-foreground font-nunito">Nascimento</p>
                            <p className="font-bold font-quicksand text-foreground mt-0.5">
                              {new Date(child.birth_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                          </div>

                          {child.blood_type ? (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-muted-foreground font-nunito">Tipo sanguíneo</p>
                              <p className="font-bold font-quicksand text-foreground mt-0.5">{child.blood_type}</p>
                            </div>
                          ) : (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-muted-foreground font-nunito">Tipo sanguíneo</p>
                              <p className="font-bold font-quicksand text-muted-foreground mt-0.5">Não informado</p>
                            </div>
                          )}

                          {g?.weight && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-muted-foreground font-nunito">Último peso</p>
                              <p className="font-bold font-quicksand mt-0.5" style={{ color: SAGE }}>{fmtWeight(g.weight)}</p>
                            </div>
                          )}

                          {g?.height && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-muted-foreground font-nunito">Última altura</p>
                              <p className="font-bold font-quicksand mt-0.5" style={{ color: MAUVE }}>{g.height} cm</p>
                            </div>
                          )}

                          {child.pediatrician && (
                            <div className="rounded-xl px-3 py-2 col-span-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-muted-foreground font-nunito">Pediatra</p>
                              <p className="font-bold font-quicksand text-foreground mt-0.5 truncate">{child.pediatrician}</p>
                            </div>
                          )}

                          {child.premature && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-muted-foreground font-nunito">Prematuro</p>
                              <p className="font-bold font-quicksand text-foreground mt-0.5">
                                {child.gestational_age_w ? `${child.gestational_age_w} sem.` : 'Sim'}
                              </p>
                            </div>
                          )}

                          {child.health_plan && (
                            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-muted-foreground font-nunito">Plano de saúde</p>
                              <p className="font-bold font-quicksand text-foreground mt-0.5 truncate">{child.health_plan}</p>
                            </div>
                          )}
                        </div>

                        {/* CTA to Saúde */}
                        <button
                          onClick={() => navigate('/health')}
                          className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold font-nunito transition-all active:scale-95"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${SAGE} 10%, transparent)`,
                            color: SAGE,
                            border: `1px solid color-mix(in srgb, ${SAGE} 22%, transparent)`,
                          }}
                        >
                          Ver perfil de saúde
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ExpandBlock>

            {/* ── Caregivers section ───────────────────────────────── */}
            <ExpandBlock
              title="Cuidadores"
              emoji="🤝"
              open={openSection === 'members'}
              onToggle={() => toggle('members')}
              badge={members.length > 0 ? String(members.length) : undefined}
            >
              {/* Roles legend */}
              <div className="rounded-xl px-3 py-2.5 space-y-1.5" style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}>
                {Object.entries(ROLE_LABEL).map(([role, label]) => (
                  <div key={role} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ROLE_COLOR[role] }} />
                    <p className="text-[11px] text-muted-foreground font-nunito">
                      <span className="font-bold text-foreground">{label}</span>
                      {' — '}
                      {role === 'admin' ? 'acesso total' : role === 'monitor' ? 'pode registrar eventos' : 'somente visualizar'}
                    </p>
                  </div>
                ))}
              </div>

              {members.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-[13px] font-bold font-quicksand text-foreground">Nenhum cuidador ainda</p>
                  <p className="text-[11px] mt-0.5 text-muted-foreground font-nunito">
                    Convide familiares para acompanhar juntos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-background border border-border">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-muted">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold font-quicksand text-foreground truncate">
                          {m.invited_email ?? 'Cuidador'}
                        </p>
                      </div>
                      <InlineStatusPill
                        label={ROLE_LABEL[m.role] ?? m.role}
                        variant="info"
                        color={ROLE_COLOR[m.role] ?? 'hsl(var(--muted-foreground))'}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Invite block */}
              <div className="flex items-center gap-3 px-4 py-4 rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${SAGE} 8%, hsl(var(--card)))`,
                  border: `1px solid color-mix(in srgb, ${SAGE} 18%, transparent)`,
                }}>
                <span className="text-[22px]">✉️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold font-quicksand text-foreground">Convidar cuidador</p>
                  <p className="text-[11px] mt-0.5 text-muted-foreground font-nunito leading-snug">
                    Compartilhe com parceiro, avós ou babá para coordenar o cuidado.
                  </p>
                </div>
                <div className="rounded-xl px-3 py-1.5 text-[11px] font-bold font-nunito flex-shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${SAGE} 16%, transparent)`, color: SAGE }}>
                  Em breve
                </div>
              </div>
            </ExpandBlock>

            {/* ── Recent activity ───────────────────────────────────── */}
            <ExpandBlock
              title="Atividade recente"
              emoji="📋"
              open={openSection === 'activity'}
              onToggle={() => toggle('activity')}
            >
              {recentLogs.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[14px] font-bold font-quicksand text-foreground">Nenhum evento ainda</p>
                  <p className="text-[12px] mt-1 text-muted-foreground font-nunito">Os registros da família aparecerão aqui.</p>
                </div>
              ) : (
                <div>
                  {recentLogs.map((log, idx) => {
                    const child = children.find(c => c.id === log.child_id);
                    return (
                      <EventCard
                        key={log.id}
                        log={log}
                        isLast={idx === recentLogs.length - 1}
                        authorLabel={child?.name}
                      />
                    );
                  })}
                  <button
                    onClick={() => navigate('/routine')}
                    className="w-full py-3 text-[12px] font-semibold font-nunito text-center rounded-2xl mt-1 transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))', backgroundColor: 'hsl(var(--muted))' }}
                  >
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
