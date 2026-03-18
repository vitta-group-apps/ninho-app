/**
 * quickActions.ts — Ninho data-driven quick action config.
 *
 * Sprint lock: exactly 4 visible quick actions (indices 0-3).
 * Prepared for future "Editar atalhos" feature — do NOT build the edit UI yet.
 * Order is age-adapted at runtime by HomePage.
 */

export interface QuickActionConfig {
  id: 'breastfeed' | 'bottle' | 'sleep' | 'diaper';
  emoji: string;
  label: string;
  path: string;
  accentColorVar: string; // CSS-resolved color string
}

export const DEFAULT_QUICK_ACTIONS: QuickActionConfig[] = [
  {
    id: 'breastfeed',
    emoji: '🤱',
    label: 'Amamentar',
    path: '/breastfeeding',
    accentColorVar: 'hsl(152,15%,55%)',
  },
  {
    id: 'sleep',
    emoji: '😴',
    label: 'Sono',
    path: '/sleep',
    accentColorVar: 'hsl(270,12%,42%)',
  },
  {
    id: 'diaper',
    emoji: '🧷',
    label: 'Fralda',
    path: '/diaper/new',
    accentColorVar: 'hsl(32,80%,57%)',
  },
  {
    id: 'bottle',
    emoji: '🍼',
    label: 'Mamadeira',
    path: '/bottle',
    accentColorVar: 'hsl(200,40%,50%)',
  },
];

/**
 * Returns the 4 visible quick actions ordered by baby age.
 * Newborns (<3m): breastfeed > sleep > diaper > bottle
 * Older babies: breastfeed > bottle > sleep > diaper
 */
export function getOrderedQuickActions(ageMonths: number): QuickActionConfig[] {
  const actions = [...DEFAULT_QUICK_ACTIONS];
  if (ageMonths < 3) {
    // Newborn order: breastfeed, sleep, diaper, bottle
    const order: QuickActionConfig['id'][] = ['breastfeed', 'sleep', 'diaper', 'bottle'];
    return order.map(id => actions.find(a => a.id === id)!);
  }
  // Default order: breastfeed, bottle, sleep, diaper
  const order: QuickActionConfig['id'][] = ['breastfeed', 'bottle', 'sleep', 'diaper'];
  return order.map(id => actions.find(a => a.id === id)!);
}
