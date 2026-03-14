import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { MockChild } from '@/hooks/useChild';

interface EmergencyBannerProps {
  child: MockChild;
}

export function EmergencyBanner({ child }: EmergencyBannerProps) {
  const hasAlerts = child.allergies.length > 0 || child.bloodType;

  if (!hasAlerts) return null;

  return (
    <div
      className="mx-5 mb-4 rounded-2xl p-4 flex gap-3 items-start"
      style={{
        backgroundColor: 'hsl(0 100% 97%)',
        borderLeft: '4px solid hsl(0 84% 60%)',
      }}
    >
      <ShieldExclamationIcon
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: 'hsl(0 84% 55%)' }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-bold uppercase tracking-wide mb-1.5"
          style={{ color: 'hsl(0 84% 50%)', fontFamily: 'Nunito, sans-serif' }}
        >
          Ficha de Emergência
        </p>
        <div className="flex flex-wrap gap-2">
          {child.bloodType && (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1"
              style={{
                backgroundColor: 'hsl(0 84% 50% / 0.1)',
                color: 'hsl(0 84% 45%)',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              🩸 Tipo: {child.bloodType}
            </span>
          )}
          {child.allergies.map((allergy, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1"
              style={{
                backgroundColor: 'hsl(0 84% 50% / 0.1)',
                color: 'hsl(0 84% 45%)',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              ⚠️ {allergy}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
