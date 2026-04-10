/**
 * NINHO — CopilotsPage · Ativação da Rede (Flow 3)
 *
 * Zeus:  Rede visual formando-se — o usuário vê o ninho crescendo.
 *        RoleCards em grid 2×2, touch ≥ 80px, sem digitação obrigatória.
 *        "Pular" sempre visível — zero pressão.
 * Lumen: "Quem cuida com você?" — a pergunta que muda tudo.
 *        Não "Adicionar usuário secundário" — humanidade primeiro.
 * Luke:  Growth loop: quem convida 1 copiloto tem retenção 2× maior.
 *        Compartilhar link = Web Share API nativa (sem formulário extra).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast }         from 'sonner';
import { Share2, Copy, Mail, Check, ArrowLeft } from 'lucide-react';
import { Text }          from '@/design-system/components/ui/Text';
import { Button }        from '@/design-system/components/ui/Button';
import { TextInput }     from '@/design-system/components/ui/TextInput';
import { LinkButton }    from '@/design-system/components/ui/LinkButton';
import { supabase }      from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';

// ─── tipos ────────────────────────────────────────────────────────────────────

type CopilotRole = 'partner' | 'grandparent' | 'nanny' | 'other';
type Step = 'roles' | 'invite' | 'done';

const ROLES: {
  id: CopilotRole; emoji: string; label: string; description: string;
}[] = [
  { id: 'partner',     emoji: '💑', label: 'Parceiro/a',      description: 'Divide o cuidado diário' },
  { id: 'grandparent', emoji: '🧓', label: 'Avó / Avô',       description: 'Apoio especial da família' },
  { id: 'nanny',       emoji: '🤝', label: 'Babá',            description: 'Cuida quando não pode estar' },
  { id: 'other',       emoji: '💙', label: 'Outro cuidador',  description: 'Alguém especial da rede' },
];

// ─── rede visual — avatares do ninho ─────────────────────────────────────────

function NestNetwork({ invitedCount }: { invitedCount: number }) {
  const slots = 4;
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      {/* Dono — sempre preenchido */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, ease: [0.34, 1.56, 0.64, 1], duration: 0.4 }}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-14 h-14 rounded-full bg-ds-accent-subtle border-2 border-ds-accent-tint flex items-center justify-center text-2xl select-none">
          🪺
        </div>
        <Text variant="caption-regular" color="secondary">Você</Text>
      </motion.div>

      {/* Linha conectora */}
      <div className="flex gap-2 items-center">
        {Array.from({ length: slots }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08, ease: [0.34, 1.56, 0.64, 1], duration: 0.35 }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={[
                'w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-lg select-none transition-all duration-300',
                i < invitedCount
                  ? 'bg-ds-success-subtle border-ds-success-border'
                  : 'bg-ds-neutral-subtle border-ds-neutral-border opacity-40',
              ].join(' ')}
            >
              {i < invitedCount ? '✓' : '+'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── role card ────────────────────────────────────────────────────────────────

interface RoleCardProps {
  emoji: string; label: string; description: string;
  isSelected: boolean; delay: number; onClick: () => void;
}

function RoleCard({ emoji, label, description, isSelected, delay, onClick }: RoleCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={isSelected}
      className={[
        'relative flex flex-col items-center gap-2 p-5 rounded-[20px] border-2 text-center',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-tint focus-visible:ring-offset-2',
        isSelected
          ? 'bg-ds-accent-subtle-2 border-ds-accent-tint'
          : 'bg-ds-neutral-subtle border-transparent',
      ].join(' ')}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-ds-accent-tint flex items-center justify-center"
        >
          <Check size={11} strokeWidth={2.5} className="text-white" aria-hidden="true" />
        </motion.div>
      )}
      <span className="text-3xl leading-none select-none" aria-hidden="true">{emoji}</span>
      <div className="flex flex-col gap-0.5">
        <Text variant="caption-medium" className={isSelected ? 'text-ds-accent-fg-strong' : ''}>
          {label}
        </Text>
        <Text variant="caption-regular" color="secondary" className="text-[11px] leading-tight">
          {description}
        </Text>
      </div>
    </motion.button>
  );
}

// ─── convite por link / e-mail ────────────────────────────────────────────────

function InvitePanel({
  role, familyId, childName,
  onBack, onSent,
}: {
  role: CopilotRole; familyId: string; childName: string;
  onBack: () => void; onSent: () => void;
}) {
  const [email,       setEmail]       = useState('');
  const [emailSent,   setEmailSent]   = useState(false);
  const [linkCopied,  setLinkCopied]  = useState(false);
  const [sending,     setSending]     = useState(false);

  const inviteLink = `${window.location.origin}/convite?fid=${familyId}&role=${role}`;
  const roleLabel = ROLES.find(r => r.id === role)?.label ?? 'Cuidador';

  async function handleShareLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Cuide do ${childName} no Ninho`,
          text: `Quero te convidar para ajudar nos cuidados do ${childName}. Entre no Ninho!`,
          url: inviteLink,
        });
        onSent();
      } else {
        await navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        toast.success('Link copiado! Compartilhe como preferir.');
        setTimeout(onSent, 1200);
      }
    } catch {
      // Usuário cancelou o share — sem erro
    }
  }

  async function handleEmailInvite() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('E-mail parece incorreto. Confere aí?');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: inviteLink,
        },
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success(`Convite enviado para ${email.trim()}!`);
      setTimeout(onSent, 1200);
    } catch {
      toast.error('Opa! Não consegui enviar. Tenta compartilhar o link.');
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      key="invite-panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-ds-neutral-fg-strong self-start"
        aria-label="Voltar"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <Text variant="caption-medium" color="secondary">Voltar</Text>
      </button>

      <div className="flex flex-col gap-1">
        <Text variant="h3" className="font-heading">Convidar {roleLabel}</Text>
        <Text variant="body-md-regular" color="secondary">
          Escolha como quer compartilhar.
        </Text>
      </div>

      {/* Compartilhar link — caminho primário */}
      <button
        type="button"
        onClick={handleShareLink}
        className={[
          'flex items-center gap-4 p-5 rounded-[20px] border-2 text-left transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-tint',
          linkCopied
            ? 'bg-ds-success-subtle border-ds-success-border'
            : 'bg-ds-neutral-subtle border-transparent hover:bg-ds-neutral-bg-hover',
        ].join(' ')}
      >
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${linkCopied ? 'bg-ds-success-tint' : 'bg-ds-accent-subtle'}`}>
          {linkCopied
            ? <Check size={20} className="text-ds-success-fg" aria-hidden="true" />
            : <Share2 size={20} className="text-ds-accent-fg" aria-hidden="true" />}
        </div>
        <div>
          <Text variant="body-md-semibold">
            {linkCopied ? 'Link copiado!' : 'Compartilhar link'}
          </Text>
          <Text variant="caption-regular" color="secondary">
            WhatsApp, mensagem, qualquer app.
          </Text>
        </div>
      </button>

      {/* Divisor */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="flex-1 h-px bg-ds-neutral-border" />
        <Text variant="caption-regular" color="secondary" as="span">ou envie por e-mail</Text>
        <div className="flex-1 h-px bg-ds-neutral-border" />
      </div>

      {/* Envio por e-mail */}
      <div className="flex flex-col gap-3">
        <TextInput
          label="E-mail do cuidador"
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="off"
          size="md"
          fullWidth
        />
        <Button
          label={emailSent ? 'Enviado! ✓' : 'Enviar convite por e-mail'}
          variant="secondary"
          size="lg"
          fullWidth
          loading={sending}
          disabled={emailSent || sending}
          onClick={handleEmailInvite}
        />
      </div>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CopilotsPage() {
  const store = useNinhoStore();
  const familyId  = store.currentFamily?.id ?? '';
  const childName = store.currentChild?.preferred_name ?? store.currentChild?.name ?? 'seu bebê';

  const [step,         setStep]         = useState<Step>('roles');
  const [selectedRole, setSelectedRole] = useState<CopilotRole | null>(null);
  const [invitedCount, setInvitedCount] = useState(0);

  function goToDashboard() {
    store.setAppState('dashboard');
  }

  function handleRoleSelect(role: CopilotRole) {
    setSelectedRole(role);
    setStep('invite');
  }

  function handleInviteSent() {
    setInvitedCount(c => c + 1);
    setStep('done');
  }

  return (
    <div
      className="min-h-screen bg-ds-pure-white flex flex-col"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >

      {/* ── header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 pb-2">
        {/* Indicador de etapa */}
        <div className="flex gap-1.5" role="progressbar" aria-label="Etapa final do onboarding">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-ds-accent-fg"
            />
          ))}
        </div>

        {/* Pular — sempre visível, nunca escondido */}
        <button
          type="button"
          onClick={goToDashboard}
          className="px-3 py-1.5 rounded-lg text-ds-neutral-fg-strong hover:bg-ds-neutral-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-neutral-border"
        >
          <Text variant="caption-medium" color="secondary">Pular</Text>
        </button>
      </header>

      {/* ── hero ────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pt-6 pb-4"
      >
        <Text variant="h1" className="font-heading tracking-tight leading-tight">
          Quem cuida com você?
        </Text>
        <Text variant="body-md-regular" color="secondary" className="mt-2">
          Convide quem faz parte do cuidado de{' '}
          <span className="font-semibold text-ds-neutral-fg-strong">{childName}</span>.
        </Text>
      </motion.section>

      {/* ── rede visual ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-6 pb-4"
      >
        <NestNetwork invitedCount={invitedCount} />
      </motion.div>

      {/* ── conteúdo dinâmico ────────────────────────────────────────────────── */}
      <main className="flex-1 px-6 pb-10">
        <AnimatePresence mode="wait">

          {/* STEP: seleção de papel */}
          {step === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <Text variant="caption-medium" color="secondary" className="mb-1">
                Quem vai convidar?
              </Text>

              {/* Grid 2×2 */}
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r, i) => (
                  <RoleCard
                    key={r.id}
                    emoji={r.emoji}
                    label={r.label}
                    description={r.description}
                    isSelected={selectedRole === r.id}
                    delay={0.1 + i * 0.07}
                    onClick={() => handleRoleSelect(r.id)}
                  />
                ))}
              </div>

              {/* CTA de pular com mais destaque */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-1 pt-4"
              >
                <Text variant="caption-regular" color="secondary">
                  Pode convidar depois também.
                </Text>
                <LinkButton
                  label="Ir para o ninho agora →"
                  linkType="interactive"
                  onClick={goToDashboard}
                />
              </motion.div>
            </motion.div>
          )}

          {/* STEP: formulário de convite */}
          {step === 'invite' && selectedRole && (
            <InvitePanel
              key="invite"
              role={selectedRole}
              familyId={familyId}
              childName={childName}
              onBack={() => { setStep('roles'); setSelectedRole(null); }}
              onSent={handleInviteSent}
            />
          )}

          {/* STEP: convite enviado — feedback positivo */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col items-center gap-6 text-center pt-4"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-[4rem] leading-none select-none"
                aria-hidden="true"
              >
                🎉
              </motion.span>
              <div className="flex flex-col gap-2">
                <Text variant="h2" className="font-heading">Convite enviado!</Text>
                <Text variant="body-md-regular" color="secondary">
                  O ninho de {childName} está crescendo.
                </Text>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Button
                  label="Convidar mais alguém"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => { setStep('roles'); setSelectedRole(null); }}
                />
                <Button
                  label="Entrar no ninho 🪺"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={goToDashboard}
                />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
