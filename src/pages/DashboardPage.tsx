import { useNavigate } from 'react-router-dom';
import { useNinhoStore } from '@/store/useNinhoStore';
import { Text } from '@/design-system/components/ui/Text';
import { Button } from '@/design-system/components/ui/Button';

export function DashboardPage() {
  const navigate = useNavigate();
  const store  = useNinhoStore();
  const child  = store.currentChild;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const name     = child?.preferred_name ?? child?.name ?? '';

  return (
    <div className="min-h-screen bg-ds-pure-white flex flex-col items-center justify-center px-6 text-center gap-6 pb-24">
      <span className="text-6xl leading-none select-none" aria-hidden="true">🪺</span>

      <div className="flex flex-col gap-2">
        <Text variant="h1" className="font-heading">
          {greeting}{name ? `, ${name}` : ''}
        </Text>
        <Text variant="body-md-regular" color="secondary">
          Tudo pronto para acompanhar o dia a dia do seu bebê.
        </Text>
      </div>

      <Button
        label="Ver rotina de hoje →"
        variant="primary"
        size="lg"
        onClick={() => navigate('/routine')}
      />
    </div>
  );
}

export default DashboardPage;
