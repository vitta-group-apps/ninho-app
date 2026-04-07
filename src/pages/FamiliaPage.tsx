/**
 * FamiliaPage — Vertical coordination hub (no horizontal tabs).
 *
 * Modelo novo:
 *  - routine_logs = fonte da verdade
 *  - payload = json estruturado
 *  - notes = texto humano
 *  - leitura direta via Tables<'routine_logs'>
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';
import { useActiveChild } from '../contexts/ActiveChildContext';
import { ChildAvatar } from '../components/home/ChildSwitcher';
import { EventCard } from '../components/events/EventCard';
import { InlineStatusPill } from '../components/ds';
import { Skeleton } from '../components/ui/skeleton';
import { PaywallGate } from '../components/PaywallGate';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const SAGE = '#789687';
const SAGE_BG = '#ebf0ed';
const SAGE_BORDER = '#ccd9d3';
const MAUVE = '#806e84';
const MAUVE_BG = '#f4f0f3';
const MAUVE_BORDER = '#e3d9e2';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const MUTED_BG = '#E8E8E2';
const MUTED_BG2 = '#F4F0F3';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const PAGE_BG = '#F8F5F0';
const EARTH = '#7e553d';
const EARTH_BG = '#f5efe9';

type RoutineLog = Tables<'routine_logs'>;

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string | null;
  invited_by: string | null;
  created_at?: string | null;
  profile?: Profile | null;
}

interface GrowthSnapshot {
  weight?: number;
  height?: number;
  date: Date;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Responsável',
  admin: 'Administrador',
  caregiver: 'Cuidador',
  viewer: 'Visualizador',
};

const ROLE_COLOR: Record<string, string> = {
  owner: EARTH,
  admin: MAUVE,
  caregiver: SAGE,
  viewer: TXT_MUTED,
};

function fmtWeight(w: number): string {
  return `${w.toFixed(2)} kg`;
}

function ExpandBlock({
  title,
  emoji,
  open,
  onToggle,
  children,
  badge,
}: {
  title: string;
  emoji: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? MUTED_BG2 : 'transparent' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
          style={{ backgroundColor: MUTED_BG }}
        >
          {emoji}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p
            className="text-[14px] font-bold font-quicksand"
            style={{ color: TXT }}
          >
            {title}
          </p>

          {badge && (
            <span
              className="text-[10px] font-bold font-nunito px-2 py-0.5 rounded-full"
              style={{ backgroundColor: SAGE_BG, color: SAGE }}
            >
              {badge}
            </span>
          )}
        </div>

        {open ? (
          <ChevronDownIcon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: TXT_MUTED }}
          />
        ) : (
          <ChevronRightIcon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: TXT_MUTED }}
          />
        )}
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
            <div
              className="px-4 pb-5 pt-3 space-y-3"
              style={{ borderTop: `1px solid ${CARD_BORDER}` }}
            >
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
  const { user } = useAuth();
  const { children, familyId, getAgeLabel } = useActiveChild();

  const [familyName, setFamilyName] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [recentLogs, setRecentLogs] = useState<RoutineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [growthMap, setGrowthMap] = useState<Record<string, GrowthSnapshot>>({});
  const [openSection, setOpenSection] = useState<
    'children' | 'members' | 'activity' | null
  >('children');

  useEffect(() => {
    async function loadGrowthSnapshots() {
      if (!children.length) {
        setGrowthMap({});
        return;
      }

      const ids = children.map(child => child.id);

      const { data, error } = await supabase
        .from('child_growth_measurements')
        .select('child_id, weight_kg, height_cm, measured_on')
        .in('child_id', ids)
        .order('measured_on', { ascending: false });

      if (error) return;

      const nextMap: Record<string, GrowthSnapshot> = {};

      for (const row of data ?? []) {
        if (nextMap[row.child_id]) continue;

        nextMap[row.child_id] = {
          weight: row.weight_kg ?? undefined,
          height: row.height_cm ?? undefined,
          date: new Date(`${row.measured_on}T12:00:00`),
        };
      }

      setGrowthMap(nextMap);
    }

    loadGrowthSnapshots();
  }, [children]);

  const loadAll = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [famRes, memRes] = await Promise.all([
        supabase.from('families').select('name').eq('id', familyId).maybeSingle(),
        supabase
          .from('family_members')
          .select('id, user_id, role, status, invited_by, created_at')
          .eq('family_id', familyId)
          .eq('status', 'active')
          .order('created_at'),
      ]);

      setFamilyName(famRes.data?.name ?? null);

      const rawMembers = (memRes.data ?? []) as Member[];
      const userIds = rawMembers.map(m => m.user_id).filter(Boolean);

      let profilesMap: Record<string, Profile> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        profilesMap = Object.fromEntries(
          ((profilesData ?? []) as Profile[]).map(profile => [profile.user_id, profile])
        );
      }

      const enrichedMembers = rawMembers.map(member => ({
        ...member,
        profile: profilesMap[member.user_id] ?? null,
      }));

      setMembers(enrichedMembers);

      if (children.length) {
        const { data, error } = await supabase
          .from('routine_logs')
          .select('*')
          .in('child_id', children.map(child => child.id))
          .order('start_time', { ascending: false })
          .limit(3);

        if (!error) {
          setRecentLogs((data ?? []) as RoutineLog[]);
        } else {
          setRecentLogs([]);
        }
      } else {
        setRecentLogs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [familyId, children]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function toggle(id: 'children' | 'members' | 'activity') {
    setOpenSection(prev => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: PAGE_BG }}>
      <div
        className="px-5 pb-5 flex-shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          backgroundColor: MAUVE,
          borderRadius: '0 0 24px 24px',
        }}
      >
        <h1
          className="text-[22px] font-bold font-quicksand"
          style={{ color: 'white' }}
        >
          Família
        </h1>
        <p
          className="text-[13px] mt-0.5 font-nunito"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {familyName ?? 'Cuidadores e crianças'}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-4 pt-5 space-y-4 pb-6"
      >
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: EARTH_BG }}
            >
              🏠
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-[15px] font-bold font-quicksand truncate"
                style={{ color: TXT }}
              >
                {familyName ?? 'Nossa família'}
              </p>
              <p className="text-[12px] font-nunito" style={{ color: TXT_MUTED }}>
                Família no Ninho
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              {
                value: children.length,
                label: `Criança${children.length !== 1 ? 's' : ''}`,
                color: EARTH,
              },
              {
                value: members.length,
                label: `Cuidador${members.length !== 1 ? 'es' : ''}`,
                color: SAGE,
              },
              {
                value: recentLogs.length,
                label: 'Recentes',
                color: MAUVE,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl py-3 text-center"
                style={{ backgroundColor: MUTED_BG }}
              >
                <p
                  className="text-[20px] font-bold font-quicksand"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider font-nunito mt-0.5"
                  style={{ color: TXT_MUTED }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <ExpandBlock
              title="Crianças"
              emoji="👶"
              open={openSection === 'children'}
              onToggle={() => toggle('children')}
              badge={children.length > 0 ? String(children.length) : undefined}
            >
              {children.length === 0 ? (
                <div className="text-center py-6">
                  <p
                    className="text-[14px] font-bold font-quicksand"
                    style={{ color: TXT }}
                  >
                    Nenhuma criança cadastrada
                  </p>
                  <p
                    className="text-[12px] mt-1 font-nunito"
                    style={{ color: TXT_MUTED }}
                  >
                    Complete o onboarding para adicionar uma criança.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map(child => {
                    const growth = growthMap[child.id];

                    return (
                      <div
                        key={child.id}
                        className="rounded-2xl p-4"
                        style={{
                          backgroundColor: PAGE_BG,
                          border: `1px solid ${CARD_BORDER}`,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <ChildAvatar child={child} size={48} />

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[15px] font-bold font-quicksand"
                              style={{ color: TXT }}
                            >
                              {child.name}
                            </p>
                            <p
                              className="text-[12px] font-nunito mt-0.5"
                              style={{ color: TXT_MUTED }}
                            >
                              {getAgeLabel(child.birth_date)}
                              {child.sex_at_birth === 'female' && ' · Menina'}
                              {child.sex_at_birth === 'male' && ' · Menino'}
                              {child.sex_at_birth === 'unknown' &&
                                ' · Prefiro não dizer'}
                            </p>
                          </div>

                          {child.blood_type && (
                            <InlineStatusPill
                              label={child.blood_type}
                              variant="info"
                              color={MAUVE}
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div
                            className="rounded-xl px-3 py-2"
                            style={{ backgroundColor: MUTED_BG }}
                          >
                            <p className="font-nunito" style={{ color: TXT_MUTED }}>
                              Nascimento
                            </p>
                            <p
                              className="font-bold font-quicksand mt-0.5"
                              style={{ color: TXT }}
                            >
                              {new Date(
                                `${child.birth_date}T00:00:00`
                              ).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </p>
                          </div>

                          <div
                            className="rounded-xl px-3 py-2"
                            style={{ backgroundColor: MUTED_BG }}
                          >
                            <p className="font-nunito" style={{ color: TXT_MUTED }}>
                              Tipo sanguíneo
                            </p>
                            <p
                              className="font-bold font-quicksand mt-0.5"
                              style={{ color: child.blood_type ? TXT : TXT_MUTED }}
                            >
                              {child.blood_type ?? 'Não informado'}
                            </p>
                          </div>

                          {growth?.weight != null && (
                            <div
                              className="rounded-xl px-3 py-2"
                              style={{ backgroundColor: MUTED_BG }}
                            >
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>
                                Último peso
                              </p>
                              <p
                                className="font-bold font-quicksand mt-0.5"
                                style={{ color: SAGE }}
                              >
                                {fmtWeight(growth.weight)}
                              </p>
                            </div>
                          )}

                          {growth?.height != null && (
                            <div
                              className="rounded-xl px-3 py-2"
                              style={{ backgroundColor: MUTED_BG }}
                            >
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>
                                Última altura
                              </p>
                              <p
                                className="font-bold font-quicksand mt-0.5"
                                style={{ color: MAUVE }}
                              >
                                {growth.height} cm
                              </p>
                            </div>
                          )}

                          {child.pediatrician && (
                            <div
                              className="rounded-xl px-3 py-2 col-span-2"
                              style={{ backgroundColor: MUTED_BG }}
                            >
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>
                                Pediatra
                              </p>
                              <p
                                className="font-bold font-quicksand mt-0.5 truncate"
                                style={{ color: TXT }}
                              >
                                {child.pediatrician}
                              </p>
                            </div>
                          )}

                          {child.premature && (
                            <div
                              className="rounded-xl px-3 py-2"
                              style={{ backgroundColor: MUTED_BG }}
                            >
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>
                                Prematuro
                              </p>
                              <p
                                className="font-bold font-quicksand mt-0.5"
                                style={{ color: TXT }}
                              >
                                {child.gestational_age_w
                                  ? `${child.gestational_age_w} sem.`
                                  : 'Sim'}
                              </p>
                            </div>
                          )}

                          {child.health_plan && (
                            <div
                              className="rounded-xl px-3 py-2"
                              style={{ backgroundColor: MUTED_BG }}
                            >
                              <p className="font-nunito" style={{ color: TXT_MUTED }}>
                                Plano de saúde
                              </p>
                              <p
                                className="font-bold font-quicksand mt-0.5 truncate"
                                style={{ color: TXT }}
                              >
                                {child.health_plan}
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => navigate('/health')}
                          className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold font-nunito transition-all active:scale-95"
                          style={{
                            backgroundColor: SAGE_BG,
                            color: SAGE,
                            border: `1px solid ${SAGE_BORDER}`,
                            cursor: 'pointer',
                          }}
                        >
                          Ver perfil de saúde
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <PaywallGate feature="segunda_crianca">
                <button
                  onClick={() => navigate('/family/add-child')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-95"
                  style={{
                    backgroundColor: MAUVE_BG,
                    border: `1px solid ${MAUVE_BORDER}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
                    style={{ backgroundColor: MUTED_BG }}
                  >
                    ➕
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className="text-[13px] font-bold font-quicksand"
                      style={{ color: TXT }}
                    >
                      Adicionar outra criança
                    </p>
                    <p
                      className="text-[11px] font-nunito mt-0.5"
                      style={{ color: TXT_MUTED }}
                    >
                      Acompanhe todos os seus filhos no mesmo lugar
                    </p>
                  </div>

                  <span
                    className="text-[13px] flex-shrink-0"
                    style={{ color: TXT_MUTED }}
                  >
                    →
                  </span>
                </button>
              </PaywallGate>
            </ExpandBlock>

            <ExpandBlock
              title="Cuidadores"
              emoji="🤝"
              open={openSection === 'members'}
              onToggle={() => toggle('members')}
              badge={members.length > 0 ? String(members.length) : undefined}
            >
              <div
                className="rounded-xl px-3 py-2.5 space-y-1.5"
                style={{ backgroundColor: MUTED_BG }}
              >
                {Object.entries(ROLE_LABEL).map(([role, label]) => (
                  <div key={role} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ROLE_COLOR[role] }}
                    />
                    <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                      <span className="font-bold" style={{ color: TXT }}>
                        {label}
                      </span>
                      {' — '}
                      {role === 'owner'
                        ? 'controle total da família'
                        : role === 'admin'
                        ? 'acesso total'
                        : role === 'caregiver'
                        ? 'pode registrar eventos'
                        : 'somente visualiza'}
                    </p>
                  </div>
                ))}
              </div>

              {members.length === 0 ? (
                <div className="text-center py-4">
                  <p
                    className="text-[13px] font-bold font-quicksand"
                    style={{ color: TXT }}
                  >
                    Nenhum cuidador ainda
                  </p>
                  <p
                    className="text-[11px] mt-0.5 font-nunito"
                    style={{ color: TXT_MUTED }}
                  >
                    Convide familiares para acompanhar juntos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map(member => {
                    const displayName =
                      member.profile?.full_name?.trim() || 'Cuidador';

                    const displayEmail =
                      member.profile?.email?.trim() ||
                      (member.user_id === user?.id ? user.email ?? null : null);

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                        style={{
                          backgroundColor: PAGE_BG,
                          border: `1px solid ${CARD_BORDER}`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: MUTED_BG }}
                        >
                          👤
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] font-bold font-quicksand truncate"
                            style={{ color: TXT }}
                          >
                            {displayName}
                          </p>

                          {displayEmail && (
                            <p
                              className="text-[11px] font-nunito truncate mt-0.5"
                              style={{ color: TXT_MUTED }}
                            >
                              {displayEmail}
                            </p>
                          )}
                        </div>

                        <InlineStatusPill
                          label={ROLE_LABEL[member.role] ?? member.role}
                          variant="info"
                          color={ROLE_COLOR[member.role] ?? TXT_MUTED}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <PaywallGate feature="cuidadores">
                <div
                  className="flex items-center gap-3 px-4 py-4 rounded-2xl"
                  style={{ backgroundColor: SAGE_BG, border: `1px solid ${SAGE_BORDER}` }}
                >
                  <span className="text-[22px]">✉️</span>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-bold font-quicksand"
                      style={{ color: TXT }}
                    >
                      Convidar cuidador
                    </p>
                    <p
                      className="text-[11px] mt-0.5 font-nunito leading-snug"
                      style={{ color: TXT_MUTED }}
                    >
                      Compartilhe com parceiro, avós ou babá para coordenar o cuidado.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/family/invite')}
                    className="rounded-xl px-3 py-1.5 text-[11px] font-bold font-nunito flex-shrink-0 text-white transition-all active:scale-95"
                    style={{
                      backgroundColor: SAGE,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Convidar
                  </button>
                </div>
              </PaywallGate>
            </ExpandBlock>

            <ExpandBlock
              title="Atividade recente"
              emoji="📋"
              open={openSection === 'activity'}
              onToggle={() => toggle('activity')}
            >
              {recentLogs.length === 0 ? (
                <div className="text-center py-6">
                  <p
                    className="text-[14px] font-bold font-quicksand"
                    style={{ color: TXT }}
                  >
                    Nenhum evento ainda
                  </p>
                  <p
                    className="text-[12px] mt-1 font-nunito"
                    style={{ color: TXT_MUTED }}
                  >
                    Os registros da família aparecerão aqui.
                  </p>
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
                    style={{
                      color: TXT_MUTED,
                      backgroundColor: MUTED_BG,
                      border: 'none',
                      cursor: 'pointer',
                    }}
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