/**
 * FamiliaPage — Coordination-focused family hub.
 *
 * Tabs: Família (overview) · Cuidadores · Crianças
 *
 * Rules:
 *  - Overview shows family summary + max 3 recent events (lightweight preview only)
 *  - NOT a duplicate timeline — Rotina owns the full event list
 *  - Role display uses InlineStatusPill
 *  - Children list uses full detail cards
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildAvatar } from '@/components/home/ChildSwitcher';
import { EventCard } from '@/components/events/EventCard';
import { InlineStatusPill, SummaryMetricCard, SectionLabel } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoutineLog } from '@/lib/eventSystem';
import { parsePayload } from '@/lib/routineUtils';
import { useNavigate } from 'react-router-dom';

type FamilyTab = 'overview' | 'members' | 'children';

const TABS: { id: FamilyTab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Família',    Icon: UserGroupIcon },
  { id: 'members',   label: 'Cuidadores', Icon: UsersIcon },
  { id: 'children',  label: 'Crianças',   Icon: UserGroupIcon },
];

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

const BROWN = 'hsl(var(--ninho-brown))';

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewSection() {
  const navigate = useNavigate();
  const { children, familyId } = useActiveChild();
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    Promise.all([
      supabase.from('families').select('name').eq('id', familyId).maybeSingle(),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
    ]).then(([fam, mem]) => {
      setFamilyName(fam.data?.name ?? null);
      setMemberCount(mem.count ?? 0);
    });
  }, [familyId]);

  // Load ONLY the last 3 recent events across all children — lightweight preview
  useEffect(() => {
    if (!children.length) return;
    setLogsLoading(true);
    const childIds = children.map(c => c.id);
    supabase.from('routine_logs').select('*')
      .in('child_id', childIds)
      .order('start_time', { ascending: false })
      .limit(3) // LOCKED at 3 — not a full timeline
      .then(({ data }) => {
        setRecentLogs(data ?? []);
        setLogsLoading(false);
      });
  }, [children]);

  if (!familyId) return (
    <div className="flex flex-col items-center text-center px-8 pt-12">
      <p className="text-[17px] font-bold font-quicksand text-foreground">Família não configurada</p>
      <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito">Complete o cadastro para criar sua família.</p>
    </div>
  );

  function handleTap(log: RoutineLog) {
    const p = parsePayload(log.notes);
    if (log.type === 'diaper') navigate(`/diaper/edit/${log.id}`);
    else if (log.type === 'feed' && p.session_type === 'breastfeed') { /* future: open detail */ }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">

      {/* Family identity card */}
      <div className="rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: 'color-mix(in srgb, hsl(var(--ninho-brown)) 10%, transparent)' }}
          >
            🏠
          </div>
          <div>
            <p className="text-[15px] font-bold font-quicksand text-foreground">{familyName ?? 'Nossa família'}</p>
            <p className="text-[12px] text-muted-foreground font-nunito">Família no Ninho</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <SummaryMetricCard emoji="👶" label="Crianças"   value={String(children.length)} accentColor={BROWN} empty={children.length === 0} />
          <SummaryMetricCard emoji="🤝" label="Cuidadores" value={String(memberCount)}      accentColor="hsl(152,15%,55%)" empty={memberCount === 0} />
        </div>
      </div>

      {/* Recent activity — LIGHTWEIGHT, max 3 items, not a full timeline */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <SectionLabel>Atividade recente</SectionLabel>
          <button
            onClick={() => navigate('/routine')}
            className="text-[11px] font-semibold font-nunito text-muted-foreground underline underline-offset-2"
          >
            Ver tudo
          </button>
        </div>

        {logsLoading ? (
          <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-[64px] rounded-2xl" />)}</div>
        ) : recentLogs.length === 0 ? (
          <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
            <p className="text-3xl mb-2">📋</p>
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
                  onTap={handleTap}
                  authorLabel={child ? child.name : undefined}
                />
              );
            })}
          </div>
        )}
      </div>

    </motion.div>
  );
}

// ─── Members ──────────────────────────────────────────────────────────────────

function MembersSection() {
  const { familyId } = useActiveChild();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    if (!familyId) { setLoading(false); return; }
    const { data } = await supabase.from('memberships')
      .select('id, user_id, role, invited_email')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });
    setMembers((data ?? []) as Member[]);
    setLoading(false);
  }, [familyId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  if (!familyId) return (
    <div className="flex flex-col items-center text-center px-8 pt-12">
      <p className="text-[17px] font-bold font-quicksand text-foreground">Família não configurada</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-4 pb-6">

      {/* Role reference */}
      <div className="rounded-2xl p-4 bg-card border border-border space-y-3">
        <SectionLabel>Funções</SectionLabel>
        {Object.entries(ROLE_LABEL).map(([role, label]) => (
          <div key={role} className="flex items-center gap-3">
            <InlineStatusPill label={label} variant="info" color={ROLE_COLOR[role]} />
            <p className="text-[12px] text-muted-foreground font-nunito">
              {role === 'admin' ? 'Acesso total' : role === 'monitor' ? 'Pode registrar eventos' : 'Somente visualizar'}
            </p>
          </div>
        ))}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-2">{[0,1].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center text-center px-8 pt-8">
          <p className="text-[15px] font-bold font-quicksand text-foreground">Nenhum cuidador ainda</p>
          <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito">Convide familiares para acompanhar junto.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-muted">👤</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold font-quicksand text-foreground truncate">
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

      {/* Invite placeholder */}
      <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-muted">
        <span className="text-[20px]">✉️</span>
        <div>
          <p className="text-[13px] font-semibold text-foreground font-nunito">Convidar cuidador</p>
          <p className="text-[11px] mt-0.5 text-muted-foreground font-nunito">Disponível em breve.</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Children ────────────────────────────────────────────────────────────────

function ChildrenSection() {
  const { children, getAgeLabel } = useActiveChild();

  if (children.length === 0) return (
    <div className="flex flex-col items-center text-center px-8 pt-12">
      <p className="text-[17px] font-bold font-quicksand text-foreground">Nenhuma criança cadastrada</p>
      <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito">Complete o onboarding para adicionar uma criança.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-3 pb-6">
      {children.map(child => (
        <div key={child.id} className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-card border border-border">
          <ChildAvatar child={child} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold font-quicksand text-foreground">{child.name}</p>
            <p className="text-[12px] mt-0.5 text-muted-foreground font-nunito">
              {new Date(child.birth_date).toLocaleDateString('pt-BR')} · {getAgeLabel(child.birth_date)}
            </p>
            {child.blood_type && (
              <p className="text-[11px] mt-0.5 text-muted-foreground font-nunito">Tipo sanguíneo: {child.blood_type}</p>
            )}
          </div>
          {child.blood_type && (
            <InlineStatusPill label={child.blood_type} variant="info" color="hsl(var(--primary))" />
          )}
        </div>
      ))}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FamiliaPage() {
  const [activeTab, setActiveTab] = useState<FamilyTab>('overview');

  return (
    <div className="min-h-screen pb-28 bg-background">
      <div
        className="px-5 pb-5"
        style={{ paddingTop: 'max(56px, env(safe-area-inset-top))', backgroundColor: 'hsl(16,14%,32%)' }}
      >
        <h1 className="text-[22px] font-bold text-white font-quicksand">Família</h1>
        <p className="text-[13px] text-white/70 mt-0.5 font-nunito">Cuidadores e crianças</p>
      </div>

      <div className="flex border-b bg-card" style={{ borderColor: 'hsl(var(--border))' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold transition-colors relative font-nunito"
              style={{ color: isActive ? BROWN : 'hsl(var(--muted-foreground))' }}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="family-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: BROWN }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'overview'  && <OverviewSection />}
          {activeTab === 'members'   && <MembersSection />}
          {activeTab === 'children'  && <ChildrenSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
