/**
 * Calendário Nacional de Vacinação da Criança — SUS 2026
 * Fonte: Calendário Nacional de Vacinação, CGPNI/DPNI/SVS/MS
 */

export interface VaccineEntry {
  id: string;
  name: string;
  shortName: string;
  ageMonths: number | null; // null = ao nascer
  ageLabel: string;
  diseases: string;
  doses?: string;
}

export const vaccineSchedule: VaccineEntry[] = [
  {
    id: 'bcg',
    name: 'BCG',
    shortName: 'BCG',
    ageMonths: 0,
    ageLabel: 'Ao nascer',
    diseases: 'Tuberculose grave',
    doses: 'Dose única',
  },
  {
    id: 'hepb-0',
    name: 'Hepatite B',
    shortName: 'Hep B',
    ageMonths: 0,
    ageLabel: 'Ao nascer',
    diseases: 'Hepatite B',
    doses: '1ª dose',
  },
  {
    id: 'penta-1',
    name: 'Pentavalente',
    shortName: 'Penta',
    ageMonths: 2,
    ageLabel: '2 meses',
    diseases: 'Difteria, Tétano, Coqueluche, Hib, Hepatite B',
    doses: '1ª dose',
  },
  {
    id: 'vip-1',
    name: 'VIP (Vacina Inativada Poliomielite)',
    shortName: 'VIP',
    ageMonths: 2,
    ageLabel: '2 meses',
    diseases: 'Poliomielite (paralisia infantil)',
    doses: '1ª dose',
  },
  {
    id: 'pneumo10-1',
    name: 'Pneumocócica 10-valente',
    shortName: 'Pneumo 10',
    ageMonths: 2,
    ageLabel: '2 meses',
    diseases: 'Pneumonia, meningite pneumocócica e otite',
    doses: '1ª dose',
  },
  {
    id: 'rota-1',
    name: 'Rotavírus Humano',
    shortName: 'Rotavírus',
    ageMonths: 2,
    ageLabel: '2 meses',
    diseases: 'Diarreia por rotavírus',
    doses: '1ª dose',
  },
  {
    id: 'penta-2',
    name: 'Pentavalente',
    shortName: 'Penta',
    ageMonths: 4,
    ageLabel: '4 meses',
    diseases: 'Difteria, Tétano, Coqueluche, Hib, Hepatite B',
    doses: '2ª dose',
  },
  {
    id: 'vip-2',
    name: 'VIP',
    shortName: 'VIP',
    ageMonths: 4,
    ageLabel: '4 meses',
    diseases: 'Poliomielite',
    doses: '2ª dose',
  },
  {
    id: 'pneumo10-2',
    name: 'Pneumocócica 10-valente',
    shortName: 'Pneumo 10',
    ageMonths: 4,
    ageLabel: '4 meses',
    diseases: 'Pneumonia, meningite pneumocócica e otite',
    doses: '2ª dose',
  },
  {
    id: 'rota-2',
    name: 'Rotavírus Humano',
    shortName: 'Rotavírus',
    ageMonths: 4,
    ageLabel: '4 meses',
    diseases: 'Diarreia por rotavírus',
    doses: '2ª dose',
  },
  {
    id: 'penta-3',
    name: 'Pentavalente',
    shortName: 'Penta',
    ageMonths: 6,
    ageLabel: '6 meses',
    diseases: 'Difteria, Tétano, Coqueluche, Hib, Hepatite B',
    doses: '3ª dose',
  },
  {
    id: 'vip-3',
    name: 'VIP',
    shortName: 'VIP',
    ageMonths: 6,
    ageLabel: '6 meses',
    diseases: 'Poliomielite',
    doses: '3ª dose',
  },
  {
    id: 'pneumo10-3',
    name: 'Pneumocócica 10-valente',
    shortName: 'Pneumo 10',
    ageMonths: 6,
    ageLabel: '6 meses',
    diseases: 'Pneumonia, meningite pneumocócica e otite',
    doses: '3ª dose',
  },
  {
    id: 'meningo-c-1',
    name: 'Meningocócica C',
    shortName: 'Meningo C',
    ageMonths: 3,
    ageLabel: '3 meses',
    diseases: 'Doença meningocócica C',
    doses: '1ª dose',
  },
  {
    id: 'meningo-c-2',
    name: 'Meningocócica C',
    shortName: 'Meningo C',
    ageMonths: 5,
    ageLabel: '5 meses',
    diseases: 'Doença meningocócica C',
    doses: '2ª dose',
  },
  {
    id: 'influenza-6m',
    name: 'Influenza',
    shortName: 'Gripe',
    ageMonths: 6,
    ageLabel: '6 meses (campanha anual)',
    diseases: 'Influenza (gripe)',
    doses: 'Dose anual',
  },
  {
    id: 'febre-amarela',
    name: 'Febre Amarela',
    shortName: 'FA',
    ageMonths: 9,
    ageLabel: '9 meses',
    diseases: 'Febre Amarela',
    doses: '1ª dose',
  },
  {
    id: 'pneumo10-ref',
    name: 'Pneumocócica 10-valente',
    shortName: 'Pneumo 10',
    ageMonths: 12,
    ageLabel: '12 meses',
    diseases: 'Pneumonia, meningite pneumocócica e otite',
    doses: 'Reforço',
  },
  {
    id: 'meningo-c-ref',
    name: 'Meningocócica C',
    shortName: 'Meningo C',
    ageMonths: 12,
    ageLabel: '12 meses',
    diseases: 'Doença meningocócica C',
    doses: 'Reforço',
  },
  {
    id: 'triplice-viral-1',
    name: 'Tríplice Viral (SCR)',
    shortName: 'SCR',
    ageMonths: 12,
    ageLabel: '12 meses',
    diseases: 'Sarampo, Caxumba, Rubéola',
    doses: '1ª dose',
  },
  {
    id: 'varicela-1',
    name: 'Varicela',
    shortName: 'Varicela',
    ageMonths: 12,
    ageLabel: '12 meses',
    diseases: 'Catapora',
    doses: '1ª dose',
  },
  {
    id: 'hepatite-a',
    name: 'Hepatite A',
    shortName: 'Hep A',
    ageMonths: 15,
    ageLabel: '15 meses',
    diseases: 'Hepatite A',
    doses: '1ª dose',
  },
  {
    id: 'triplice-bact-1-ref',
    name: 'DTP (Tríplice Bacteriana)',
    shortName: 'DTP',
    ageMonths: 15,
    ageLabel: '15 meses',
    diseases: 'Difteria, Tétano, Coqueluche',
    doses: '1º reforço',
  },
  {
    id: 'vop-1-ref',
    name: 'VOP (Vacina Oral Poliomielite)',
    shortName: 'VOP',
    ageMonths: 15,
    ageLabel: '15 meses',
    diseases: 'Poliomielite',
    doses: '1º reforço',
  },
  {
    id: 'triplice-viral-2',
    name: 'Tríplice Viral (SCR)',
    shortName: 'SCR',
    ageMonths: 15,
    ageLabel: '15 meses',
    diseases: 'Sarampo, Caxumba, Rubéola',
    doses: '2ª dose',
  },
  {
    id: 'dtp-2-ref',
    name: 'DTP (Tríplice Bacteriana)',
    shortName: 'DTP',
    ageMonths: 48,
    ageLabel: '4 anos',
    diseases: 'Difteria, Tétano, Coqueluche',
    doses: '2º reforço',
  },
  {
    id: 'vop-2-ref',
    name: 'VOP',
    shortName: 'VOP',
    ageMonths: 48,
    ageLabel: '4 anos',
    diseases: 'Poliomielite',
    doses: '2º reforço',
  },
  {
    id: 'varicela-2',
    name: 'Varicela',
    shortName: 'Varicela',
    ageMonths: 48,
    ageLabel: '4 anos',
    diseases: 'Catapora',
    doses: '2ª dose',
  },
  {
    id: 'fa-ref',
    name: 'Febre Amarela',
    shortName: 'FA',
    ageMonths: 48,
    ageLabel: '4 anos',
    diseases: 'Febre Amarela',
    doses: 'Reforço único',
  },
  {
    id: 'hpv-1',
    name: 'HPV Quadrivalente',
    shortName: 'HPV',
    ageMonths: 108,
    ageLabel: '9 anos',
    diseases: 'HPV',
    doses: '1ª dose',
  },
  {
    id: 'hpv-2',
    name: 'HPV Quadrivalente',
    shortName: 'HPV',
    ageMonths: 120,
    ageLabel: '10 anos',
    diseases: 'HPV',
    doses: '2ª dose',
  },
  {
    id: 'meningo-acwy',
    name: 'Meningocócica ACWY',
    shortName: 'Meningo ACWY',
    ageMonths: 132,
    ageLabel: '11 anos',
    diseases: 'Doença meningocócica ACWY',
    doses: 'Dose única',
  },
  {
    id: 'dtp-adolescente',
    name: 'dTpa (Tríplice Acelular)',
    shortName: 'dTpa',
    ageMonths: 132,
    ageLabel: '11 anos',
    diseases: 'Difteria, Tétano, Coqueluche',
    doses: 'Reforço',
  },
];

/**
 * Calcula a próxima vacina com base na data de nascimento
 */
export function getNextVaccine(birthDate: Date): {
  vaccine: VaccineEntry;
  scheduledDate: Date;
  daysUntil: number;
} | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedVaccines = [...vaccineSchedule].sort(
    (a, b) => (a.ageMonths ?? 0) - (b.ageMonths ?? 0)
  );

  for (const vaccine of sortedVaccines) {
    const ageMonths = vaccine.ageMonths ?? 0;
    const scheduledDate = new Date(birthDate);
    scheduledDate.setMonth(scheduledDate.getMonth() + ageMonths);
    scheduledDate.setHours(0, 0, 0, 0);

    if (scheduledDate >= today) {
      const daysUntil = Math.ceil(
        (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { vaccine, scheduledDate, daysUntil };
    }
  }

  return null;
}

/**
 * Dados de desenvolvimento por faixa etária (baseado em marcos do Denver II)
 */
export const developmentMilestones: Record<string, { title: string; milestones: string[]; emoji: string }> = {
  '0': {
    title: 'Recém-nascido',
    emoji: '🌱',
    milestones: ['Reflexo de sucção', 'Foca o olhar a 20-30cm', 'Reage a sons altos', 'Movimentos reflexivos dos membros'],
  },
  '1': {
    title: '1 mês',
    emoji: '✨',
    milestones: ['Segue objetos com o olhar', 'Sorri em resposta ao rosto humano', 'Vocaliza sons suaves', 'Levanta cabeça brevemente de bruços'],
  },
  '2': {
    title: '2 meses',
    emoji: '😊',
    milestones: ['Sorriso social (responde ao sorriso)', 'Acompanha objeto 180°', 'Vocaliza vogais', 'Controla cabeça por alguns segundos'],
  },
  '3': {
    title: '3 meses',
    emoji: '🎵',
    milestones: ['Ri em voz alta', 'Sustenta cabeça firme', 'Abre e fecha as mãos', 'Reconhece rostos familiares'],
  },
  '4': {
    title: '4 meses',
    emoji: '🙌',
    milestones: ['Controle firme da cabeça', 'Sorrisos sociais frequentes', 'Balbucio expressivo', 'Alcança e toca objetos'],
  },
  '5': {
    title: '5 meses',
    emoji: '🎯',
    milestones: ['Senta com apoio', 'Transfere objetos entre mãos', 'Reconhece seu próprio nome', 'Explora objetos com a boca'],
  },
  '6': {
    title: '6 meses',
    emoji: '🧸',
    milestones: ['Senta sem apoio por instantes', 'Balbucio com consoantes (ba, ma)', 'Estranhamento com desconhecidos', 'Passa objetos de mão a mão'],
  },
};

export function getDevelopmentMilestone(birthDate: Date) {
  const today = new Date();
  const ageMonths = Math.floor(
    (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  const key = String(Math.min(ageMonths, 6));
  return developmentMilestones[key] || developmentMilestones['6'];
}
