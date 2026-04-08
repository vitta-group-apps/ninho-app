/**
 * NINHO — ProfilePage
 * Configurações no estilo Apple Settings — grupos via Card, chevrons, DS tokens.
 */

import React from 'react';
import { toast }     from 'sonner';
import { Text }      from '@/design-system/components/ui/Text';
import { Card }      from '@/design-system/components/ui/Card';
import { Button }    from '@/design-system/components/ui/Button';
import { Avatar }    from '@/design-system/components/ui/Avatar';
import { Divider }   from '@/design-system/components/ui/Divider';
import { supabase }  from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';
import { cn }        from '@/design-system/lib/utils';

// ─── icon helpers ─────────────────────────────────────────────────────────────

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-ds-neutral-fg opacity-50">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FamilyIcon()  { return <span className="text-base" aria-hidden="true">👨‍👩‍👧</span>; }
function ChildIcon()   { return <span className="text-base" aria-hidden="true">🧒</span>; }
function BellIcon()    { return <span className="text-base" aria-hidden="true">🔔</span>; }
function LockIcon()    { return <span className="text-base" aria-hidden="true">🔒</span>; }
function HelpIcon()    { return <span className="text-base" aria-hidden="true">💬</span>; }
function InfoIcon()    { return <span className="text-base" aria-hidden="true">ℹ️</span>; }

// ─── row ─────────────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon:      React.ReactNode;
  label:     string;
  detail?:   string;
  badge?:    string;
  onPress?:  () => void;
  isLast?:   boolean;
}

function SettingsRow({ icon, label, detail, badge, onPress, isLast }: SettingsRowProps) {
  return (
    <>
      <button
        type="button"
        onClick={onPress}
        disabled={!onPress}
        className={cn(
          'w-full flex items-center gap-[var(--gap-md)] px-[var(--padding-md)] py-[14px]',
          'text-left transition-colors duration-100',
          onPress ? 'hover:bg-ds-neutral-subtle active:bg-ds-neutral-subtle cursor-pointer' : 'cursor-default',
          'focus-visible:outline-none focus-visible:bg-ds-neutral-subtle',
        )}
      >
        <span className="w-7 h-7 rounded-[var(--radius-xs)] bg-ds-neutral-subtle flex items-center justify-center shrink-0">
          {icon}
        </span>

        <div className="flex-1 min-w-0">
          <Text variant="body-md-regular" as="span">{label}</Text>
          {detail && (
            <Text variant="caption-regular" color="secondary" as="p" className="truncate">{detail}</Text>
          )}
        </div>

        {badge && (
          <span className="px-[var(--padding-xs)] py-[2px] rounded-ds-pill bg-ds-accent-subtle text-ds-accent-fg font-body text-text-xs font-semibold shrink-0">
            {badge}
          </span>
        )}

        {onPress && <Chevron />}
      </button>

      {!isLast && <Divider />}
    </>
  );
}

// ─── section ─────────────────────────────────────────────────────────────────

interface SettingsSectionProps {
  title?: string;
  items:  Omit<SettingsRowProps, 'isLast'>[];
}

function SettingsSection({ title, items }: SettingsSectionProps) {
  return (
    <div>
      {title && (
        <Text variant="caption-medium" color="secondary" as="p" className="px-1 mb-[var(--gap-xs)] uppercase tracking-wider">
          {title}
        </Text>
      )}
      <Card variant="outlined" padding="none" className="overflow-hidden">
        {items.map((item, i) => (
          <SettingsRow key={item.label} {...item} isLast={i === items.length - 1} />
        ))}
      </Card>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { profile, currentFamily, currentChild, children, reset } = useNinhoStore();

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      reset();
      toast.success('Sessão encerrada.');
    } catch {
      toast.error('Erro ao sair. Tenta de novo.');
    }
  }

  const displayName = profile?.full_name ?? 'Utilizador';
  const initials    = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── header ──────────────────────────────────────────────────────── */}
      <header className="bg-ds-pure-white border-b border-ds-neutral-border px-4 pt-12 pb-6">
        <div className="flex items-center gap-[var(--gap-md)]">
          <Avatar
            initials={initials}
            size="lg"
          />
          <div>
            <Text variant="h3">{displayName}</Text>
            {currentFamily && (
              <Text variant="caption-regular" color="secondary">
                Família {currentFamily.name}
              </Text>
            )}
          </div>
        </div>
      </header>

      {/* ── body ────────────────────────────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6">

        <SettingsSection
          title="Família"
          items={[
            {
              icon:   <FamilyIcon />,
              label:  'Família',
              detail: currentFamily?.name ?? 'Sem família',
            },
            {
              icon:   <ChildIcon />,
              label:  'Crianças',
              detail: children.length > 0
                ? children.map(c => c.preferred_name ?? c.name).join(', ')
                : 'Nenhuma criança',
              badge:  children.length > 0 ? String(children.length) : undefined,
            },
          ]}
        />

        <SettingsSection
          title="Criança ativa"
          items={[
            {
              icon:   <ChildIcon />,
              label:  currentChild?.preferred_name ?? currentChild?.name ?? 'Nenhuma',
              detail: currentChild?.birth_date
                ? `Nasceu em ${new Date(currentChild.birth_date).toLocaleDateString('pt-PT')}`
                : undefined,
            },
          ]}
        />

        <SettingsSection
          title="App"
          items={[
            { icon: <BellIcon />, label: 'Notificações', detail: 'Em breve' },
            { icon: <LockIcon />, label: 'Privacidade',  detail: 'Em breve' },
          ]}
        />

        <SettingsSection
          title="Suporte"
          items={[
            { icon: <HelpIcon />, label: 'Contacta-nos', detail: 'Em breve' },
            { icon: <InfoIcon />, label: 'Sobre o Ninho', detail: 'v2.0 — feat/reconstrucao' },
          ]}
        />

        {/* logout */}
        <Button
          label="Terminar sessão"
          variant="secondary"
          size="md"
          fullWidth
          onClick={handleSignOut}
        />

        <Text variant="caption-regular" color="secondary" className="text-center">
          Ninho v2 · Feito com ❤️ para pais e bebés
        </Text>
      </main>
    </div>
  );
}
