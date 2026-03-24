import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { InlineStatusPill } from '@/components/ds';
import { ChildAvatar } from '@/components/home/ChildSwitcher';
import { PaywallGate } from '@/components/PaywallGate';
import {
  ChevronRightIcon,
  UserCircleIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  LanguageIcon,
  ScaleIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';

// ── Cores fixas ──
const SAGE = '#789687';
const SAGE_BG = '#ebf0ed';
const SAGE_BORDER = '#ccd9d3';
const MAUVE = '#806e84';
const MAUVE_BG = '#f4f0f3';
const MAUVE_BORDER = '#e3d9e2';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const MUTED_BG = '#E8E8E2';
const PAGE_BG = '#F8F5F0';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const EARTH = '#7e553d';
const EARTH_BG = '#f5efe9';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
      style={{ color: TXT_MUTED }}
    >
      {children}
    </p>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onClick,
  rightSlot,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 text-left rounded-2xl transition-all active:scale-[0.99]"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: MUTED_BG, color: TXT_MUTED }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>
            {subtitle}
          </p>
        )}
      </div>

      {rightSlot ?? <ChevronRightIcon className="w-4 h-4 flex-shrink-0" style={{ color: TXT_MUTED }} />}
    </button>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeChild, children, getAgeLabel } = useActiveChild();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/onboarding/auth?tab=login');
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: PAGE_BG }}>
      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          backgroundColor: MAUVE,
          borderRadius: '0 0 24px 24px',
        }}
      >
        <h1 className="text-[22px] font-bold font-quicksand" style={{ color: 'white' }}>
          Perfil
        </h1>
        <p className="text-[13px] mt-0.5 font-nunito" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Conta, família, dados e preferências
        </p>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Criança ativa */}
        <div>
          <SectionTitle>Criança ativa</SectionTitle>

          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            {activeChild ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <ChildAvatar child={activeChild} size={52} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>
                        {activeChild.name}
                      </p>
                      <InlineStatusPill label="Criança ativa" variant="active" color={SAGE} />
                    </div>
                    <p className="text-[12px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                      {getAgeLabel(activeChild.birth_date)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/family')}
                    className="py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
                    style={{
                      backgroundColor: SAGE_BG,
                      color: SAGE,
                      border: `1px solid ${SAGE_BORDER}`,
                    }}
                  >
                    Trocar criança
                  </button>

                  <button
                    onClick={() => navigate('/onboarding/child')}
                    className="py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
                    style={{
                      backgroundColor: MAUVE_BG,
                      color: MAUVE,
                      border: `1px solid ${MAUVE_BORDER}`,
                    }}
                  >
                    Adicionar criança
                  </button>
                </div>

                {children.length <= 1 && (
                  <PaywallGate feature="multiple_children">
                    <div
                      className="mt-4 rounded-2xl p-4"
                      style={{ backgroundColor: EARTH_BG, border: `1px solid ${CARD_BORDER}` }}
                    >
                      <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                        Acompanhe mais de uma criança
                      </p>
                      <p className="text-[11px] mt-1 font-nunito leading-snug" style={{ color: TXT_MUTED }}>
                        Organize irmãos no mesmo app e mantenha o histórico separado por perfil.
                      </p>
                    </div>
                  </PaywallGate>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>
                  Nenhuma criança ativa
                </p>
                <p className="text-[12px] mt-1 font-nunito" style={{ color: TXT_MUTED }}>
                  Adicione uma criança para começar a usar o app.
                </p>

                <button
                  onClick={() => navigate('/onboarding/child')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
                  style={{
                    backgroundColor: MAUVE_BG,
                    color: MAUVE,
                    border: `1px solid ${MAUVE_BORDER}`,
                  }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar criança
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conta */}
        <div>
          <SectionTitle>Sua conta</SectionTitle>
          <div className="space-y-2">
            <SettingsRow
              icon={<UserCircleIcon className="w-5 h-5" />}
              title="Seu perfil"
              subtitle={user?.email ?? 'Conta conectada'}
              onClick={() => navigate('/profile/account')}
            />

            <SettingsRow
              icon={<LanguageIcon className="w-5 h-5" />}
              title="Idioma"
              subtitle="Português do Brasil"
              onClick={() => navigate('/profile/language')}
            />

            <SettingsRow
              icon={<ScaleIcon className="w-5 h-5" />}
              title="Unidades de medida"
              subtitle="Peso, altura e preferências de exibição"
              onClick={() => navigate('/profile/units')}
            />
          </div>
        </div>

        {/* Família */}
        <div>
          <SectionTitle>Família</SectionTitle>
          <div className="space-y-2">
            <SettingsRow
              icon={<UsersIcon className="w-5 h-5" />}
              title="Cuidadores e compartilhamento"
              subtitle="Gerencie convites, permissões e acesso da família"
              onClick={() => navigate('/family')}
            />
          </div>
        </div>

        {/* Dados */}
        <div>
          <SectionTitle>Dados</SectionTitle>
          <div className="space-y-2">
            <SettingsRow
              icon={<ArrowDownTrayIcon className="w-5 h-5" />}
              title="Exportar dados"
              subtitle="Baixe os registros da criança e da rotina"
              onClick={() => navigate('/profile/export')}
            />

            <SettingsRow
              icon={<ArrowUpTrayIcon className="w-5 h-5" />}
              title="Importar dados"
              subtitle="Importe histórico de outros apps via CSV"
              onClick={() => navigate('/profile/import')}
            />
          </div>
        </div>

        {/* Plano */}
        <div>
          <SectionTitle>Plano</SectionTitle>
          <div className="space-y-2">
            <SettingsRow
              icon={<CreditCardIcon className="w-5 h-5" />}
              title="Plano e recursos premium"
              subtitle="Veja seu plano atual e recursos disponíveis"
              onClick={() => navigate('/profile/plan')}
              rightSlot={
                <span
                  className="text-[10px] font-bold font-nunito px-2 py-1 rounded-full"
                  style={{ backgroundColor: SAGE_BG, color: SAGE }}
                >
                  Premium
                </span>
              }
            />
          </div>
        </div>

        {/* Suporte */}
        <div>
          <SectionTitle>Suporte</SectionTitle>
          <div className="space-y-2">
            <SettingsRow
              icon={<QuestionMarkCircleIcon className="w-5 h-5" />}
              title="Ajuda e suporte"
              subtitle="Dúvidas, privacidade, termos e suporte"
              onClick={() => navigate('/profile/help')}
            />

            <SettingsRow
              icon={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
              title="Sair da conta"
              subtitle="Encerrar sessão neste dispositivo"
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
