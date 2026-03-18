/**
 * FamiliaPage — Structural shell for family management.
 *
 * Sections:
 *  - Família (overview)
 *  - Cuidadores (members list + invite)
 *  - Criança (child info entry point)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  UserPlusIcon,
  UsersIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildAvatar } from '@/components/home/ChildSwitcher';

// ─── Types ────────────────────────────────────────────────────────────────────

type FamilyTab = 'overview' | 'members' | 'children';

const TABS: { id: FamilyTab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview', label: 'Família',     Icon: UserGroupIcon },
  { id: 'members',  label: 'Cuidadores',  Icon: UsersIcon },
  { id: 'children', label: 'Crianças',    Icon: UserGroupIcon },
];

interface Member {
  id: string;
  user_id: string;
  role: string;
  invited_email: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin:   'Administrador',
  monitor: 'Cuidador',
  viewer:  'Observador',
};

const BROWN = 'hsl(var(--ninho-brown))';
const font = 'Nunito, sans-serif';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ emoji, title, description, action }: {
  emoji: string; title: string; description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center px-8 pt-12 pb-6">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 text-4xl"
        style={{ backgroundColor: 'hsl(var(--muted))' }}>
        {emoji}
      </div>
      <p className="text-lg font-bold mb-2"
        style={{ color: BROWN, fontFamily: 'Quicksand, sans-serif' }}>{title}</p>
      <p className="text-sm leading-relaxed"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>{description}</p>
      {action && (
        <button onClick={action.onClick}
          className="mt-5 px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
          style={{ backgroundColor: BROWN, color: 'white', fontFamily: font }}>
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewSection() {
  const { user } = useAuth();
  const { children, familyId } = useActiveChild();
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);

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

  if (!familyId) {
    return <EmptyState emoji="🏠" title="Família não configurada"
      description="Complete o cadastro para criar sua família no Ninho." />;
  }

  const stats = [
    { emoji: '👶', label: 'Crianças', value: String(children.length) },
    { emoji: '🤝', label: 'Cuidadores', value: String(memberCount) },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 space-y-5">
      {/* Family name card */}
      <div className="rounded-2xl p-5"
        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'hsl(var(--ninho-brown) / 0.08)' }}>
            🏠
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: BROWN, fontFamily: 'Quicksand, sans-serif' }}>
              {familyName ?? 'Nossa família'}
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              Família no Ninho
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {stats.map(s => (
            <div key={s.label} className="flex-1 rounded-xl py-3 text-center"
              style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-lg">{s.emoji}</p>
              <p className="text-lg font-bold mt-1" style={{ color: BROWN, fontFamily: 'Quicksand, sans-serif' }}>
                {s.value}
              </p>
              <p className="text-[10px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Children preview */}
      {children.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
            Crianças
          </p>
          <div className="space-y-2">
            {children.map(child => (
              <div key={child.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <ChildAvatar child={child} size={40} />
                <div>
                  <p className="text-sm font-bold" style={{ color: BROWN, fontFamily: 'Quicksand, sans-serif' }}>
                    {child.name}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                    {new Date(child.birth_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
    const { data } = await supabase
      .from('memberships')
      .select('id, user_id, role, invited_email')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });
    setMembers((data ?? []) as Member[]);
    setLoading(false);
  }, [familyId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  if (!familyId) {
    return <EmptyState emoji="🤝" title="Família não configurada"
      description="Complete o cadastro para gerenciar cuidadores." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 space-y-4">
      {/* Role legend */}
      <div className="rounded-2xl p-4 space-y-2"
        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
          Funções disponíveis
        </p>
        {Object.entries(ROLE_LABEL).map(([role, label]) => (
          <div key={role} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: role === 'admin' ? BROWN : role === 'monitor' ? 'hsl(152,15%,55%)' : 'hsl(var(--muted-foreground))' }} />
            <span className="text-xs font-semibold" style={{ color: BROWN, fontFamily: font }}>{label}</span>
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              — {role === 'admin' ? 'acesso total' : role === 'monitor' ? 'pode registrar eventos' : 'somente visualizar'}
            </span>
          </div>
        ))}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-2">
          {[0,1,2].map(i => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState emoji="👥" title="Nenhum cuidador ainda"
          description="Convide familiares ou cuidadores para acompanhar junto." />
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: 'hsl(var(--muted))', color: BROWN }}>
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate"
                  style={{ color: BROWN, fontFamily: 'Quicksand, sans-serif' }}>
                  {m.invited_email ?? 'Cuidador'}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                  {ROLE_LABEL[m.role] ?? m.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite hint */}
      <div className="flex items-start gap-3 px-4 py-4 rounded-2xl"
        style={{ backgroundColor: 'hsl(var(--muted))' }}>
        <UserPlusIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: BROWN, fontFamily: font }}>
            Convidar cuidador
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
            O convite por email estará disponível em breve.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Children section ─────────────────────────────────────────────────────────

function ChildrenSection() {
  const { children } = useActiveChild();

  if (children.length === 0) {
    return <EmptyState emoji="👶" title="Nenhuma criança cadastrada"
      description="Complete o cadastro para adicionar uma criança à família." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 space-y-3">
      {children.map(child => (
        <div key={child.id} className="flex items-center gap-3 px-4 py-4 rounded-2xl"
          style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <ChildAvatar child={child} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold" style={{ color: BROWN, fontFamily: 'Quicksand, sans-serif' }}>
              {child.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              Nascimento: {new Date(child.birth_date).toLocaleDateString('pt-BR')}
            </p>
            {child.blood_type && (
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                Tipo sanguíneo: {child.blood_type}
              </p>
            )}
          </div>
          <ChevronRightIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </div>
      ))}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FamiliaPage() {
  const [activeTab, setActiveTab] = useState<FamilyTab>('overview');

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          background: 'linear-gradient(135deg, hsl(var(--ninho-brown)), hsl(16,14%,42%))',
        }}
      >
        <h1 className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Quicksand, sans-serif' }}>Família</h1>
        <p className="text-sm text-white/70 mt-0.5"
          style={{ fontFamily: font }}>Cuidadores e crianças</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold transition-colors relative"
              style={{ color: isActive ? BROWN : 'hsl(var(--muted-foreground))', fontFamily: font }}>
              <tab.Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div layoutId="family-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: BROWN }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {activeTab === 'overview'  && <OverviewSection />}
          {activeTab === 'members'   && <MembersSection />}
          {activeTab === 'children'  && <ChildrenSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
