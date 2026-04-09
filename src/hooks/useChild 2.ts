import { useState } from 'react';

export interface MockChild {
  id: string;
  name: string;
  birthDate: Date;
  bloodType: string;
  allergies: string[];
  medications: string[];
  avatarColor: string;
}

// Mock data — será substituído por dados reais do Supabase nas próximas releases
export const mockChildren: MockChild[] = [
  {
    id: '1',
    name: 'Lucas',
    birthDate: new Date(2025, 10, 14), // 14 Nov 2025 — ~4 meses em Mar/2026
    bloodType: 'O+',
    allergies: ['Proteína do Leite de Vaca (APLV)'],
    medications: ['Simeticona (se necessário)'],
    avatarColor: '#7A9A8B',
  },
  {
    id: '2',
    name: 'Sofia',
    birthDate: new Date(2023, 5, 22), // 22 Jun 2023
    bloodType: 'A+',
    allergies: [],
    medications: [],
    avatarColor: '#8A7A92',
  },
];

export function useChild() {
  const [activeChildId, setActiveChildId] = useState<string>(mockChildren[0].id);

  const activeChild = mockChildren.find(c => c.id === activeChildId) ?? mockChildren[0];

  function getAgeLabel(birthDate: Date): string {
    const today = new Date();
    const diffMs = today.getTime() - birthDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30.44);
    const years = Math.floor(months / 12);

    if (months < 1) return `${diffDays}d`;
    if (months < 24) return `${months}m`;
    return `${years}a`;
  }

  return {
    children: mockChildren,
    activeChild,
    activeChildId,
    setActiveChildId,
    getAgeLabel,
  };
}
