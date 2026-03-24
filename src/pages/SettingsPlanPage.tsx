import { useNavigate } from 'react-router-dom';

const PAGE_BG = '#F8F5F0';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const MAUVE = '#806e84';

export default function SettingsPlanPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div className="px-5 pb-5" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', backgroundColor: MAUVE, borderRadius: '0 0 24px 24px' }}>
        <button onClick={() => navigate('/settings')} className="mb-4 text-[13px] font-bold font-nunito" style={{ color: 'rgba(255,255,255,0.75)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Voltar
        </button>
        <h1 className="text-[22px] font-bold font-quicksand" style={{ color: 'white' }}>Plano</h1>
        <p className="text-[13px] mt-1 font-nunito" style={{ color: 'rgba(255,255,255,0.65)' }}>Plano atual e recursos premium</p>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
          <p className="text-[15px] font-bold font-quicksand" style={{ color: TXT }}>Em construção</p>
          <p className="text-[12px] mt-1.5 font-nunito leading-snug" style={{ color: TXT_MUTED }}>
            Aqui você poderá ver seu plano, benefícios e opções de upgrade.
          </p>
        </div>
      </div>
    </div>
  );
}
