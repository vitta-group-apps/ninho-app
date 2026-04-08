/**
 * NINHO — Tipos de Rotina (Fase 1)
 *
 * Fonte de verdade: tabela `routine_logs` + enum `routine_log_type`
 * Coluna `payload` é JSONB — estas interfaces tipam o seu conteúdo.
 *
 * Princípio de design:
 *   O enum do banco define os 4 tipos. Aqui criamos um union discriminado
 *   que garante em compile-time que um log de 'sleep' NUNCA terá campos
 *   de 'feed'. O TypeScript rejeita o código antes de ele chegar ao Supabase.
 *
 * Hierarquia:
 *   RoutineLogType          — enum literal (espelha o DB enum)
 *   *Payload                — campos JSONB de cada tipo
 *   RoutinePayload          — union discriminada por logType
 *   RoutineLogInput         — input completo para insert (sem IDs gerados pelo DB)
 *   RoutineLogUpdate        — input parcial para update
 *   RoutineLog              — Row completo vindo do Supabase
 *   RoutineLogWithPayload   — Row com payload tipado (pós-deserialização)
 *   LogDisplayMeta          — metadados de UI calculados a partir do log
 *                             (sem JSX — Fase 2 cuida do render)
 */

import type { Tables, Enums } from '@/integrations/supabase/types';

// ─────────────────────────────────────────────────────────────────────────────
// 1. TIPO CENTRAL — espelha o enum `routine_log_type` do banco
// ─────────────────────────────────────────────────────────────────────────────

export type RoutineLogType = Enums<'routine_log_type'>;
// 'sleep' | 'feed' | 'diaper' | 'note'

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAYLOADS JSONB — um tipo por variante de rotina
//
// Regras de design:
//   • Usar `readonly logType` como discriminante (auto-documenta o JSONB no banco)
//   • Campos opcionais com `?` — nunca `| null` (JSONB omite campos ausentes)
//   • Enums string são preferíveis a `boolean` para extensibilidade
// ─────────────────────────────────────────────────────────────────────────────

export interface SleepPayload {
  /** Discriminante — salvo no JSONB para auto-documentação */
  readonly logType: 'sleep';
  /** Qualidade percebida do sono */
  quality?: 'good' | 'fair' | 'poor';
  /** Onde o bebê dormiu */
  location?: 'crib' | 'bed' | 'carrier' | 'stroller' | 'sofa' | 'other';
}

export interface FeedPayload {
  readonly logType: 'feed';
  /** Método de alimentação — obrigatório para consistência analítica */
  method: 'breast' | 'bottle' | 'solid' | 'mixed';
  /** Lado da amamentação — só relevante quando method = 'breast' */
  side?: 'left' | 'right' | 'both';
  /** Volume em ml — só relevante quando method = 'bottle' */
  amount_ml?: number;
  /** Alimentos introduzidos — só relevante quando method = 'solid' | 'mixed' */
  foods?: string[];
}

export interface DiaperPayload {
  readonly logType: 'diaper';
  /** Conteúdo da fralda */
  content: 'wet' | 'dirty' | 'both' | 'dry';
  /** Cor das fezes — dado clínico relevante para pediatras */
  stool_color?: 'yellow' | 'brown' | 'green' | 'black' | 'red' | 'other';
  /** Consistência — dado clínico relevante */
  consistency?: 'normal' | 'loose' | 'watery' | 'hard';
}

export interface NotePayload {
  readonly logType: 'note';
  /** Tags livres para categorização rápida */
  tags?: string[];
  /** Humor percebido da criança no momento do registro */
  mood?: 'happy' | 'calm' | 'fussy' | 'crying' | 'sleepy';
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. UNION DISCRIMINADA — o compilador usa `logType` como narrowing key
//
// Exemplo de narrowing correto:
//   if (payload.logType === 'feed') {
//     payload.method   // ✅ TypeScript sabe que é FeedPayload
//     payload.quality  // ❌ Erro de compilação — campo de SleepPayload
//   }
// ─────────────────────────────────────────────────────────────────────────────

export type RoutinePayload =
  | SleepPayload
  | FeedPayload
  | DiaperPayload
  | NotePayload;

// ─────────────────────────────────────────────────────────────────────────────
// 4. INPUT DE ESCRITA — discriminado pelo campo `type` (== enum do banco)
//
// O TypeScript garante que type:'sleep' só aceita SleepPayload como payload.
// Isso previne em compile-time que um log de sono envie dados de alimentação.
// ─────────────────────────────────────────────────────────────────────────────

interface RoutineLogBase {
  /** ID da criança — obrigatório, validado por RLS (can_log_for_child) */
  childId: string;
  /** ISO-8601. Default: now() no banco */
  startTime?: string;
  /** ISO-8601. Opcional — usado em sono e amamentação com tempo de término */
  endTime?: string;
  /** Texto livre — complementa o payload estruturado */
  notes?: string;
}

export type RoutineLogInput =
  | (RoutineLogBase & { type: 'sleep';  payload: SleepPayload  })
  | (RoutineLogBase & { type: 'feed';   payload: FeedPayload   })
  | (RoutineLogBase & { type: 'diaper'; payload: DiaperPayload })
  | (RoutineLogBase & { type: 'note';   payload: NotePayload   });

/**
 * Input parcial para update.
 * Usa Pick<> + Partial<> para nunca permitir mudar type ou child_id.
 * O payload é `RoutinePayload` (não discriminado) porque no update
 * o `type` do log já está fixado no banco — mudá-lo não faz sentido.
 */
export interface RoutineLogUpdate {
  startTime?: string;
  endTime?:   string | null;
  notes?:     string | null;
  payload?:   Partial<Omit<RoutinePayload, 'logType'>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TIPOS DE LEITURA — dados vindos do Supabase
// ─────────────────────────────────────────────────────────────────────────────

/** Row pura do banco — payload é `Json` (opaco) */
export type RoutineLog = Tables<'routine_logs'>;

/**
 * Row enriquecida com payload tipado.
 * Gerada pelo hook após deserialização e type-narrowing do JSONB.
 * Use esta em componentes de UI (Fase 2) — nunca acesse RoutineLog.payload diretamente.
 */
export type RoutineLogWithPayload = Omit<RoutineLog, 'payload'> & {
  payload: RoutinePayload;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. METADADOS DE DISPLAY — calculados, sem JSX (Fase 2 cuida do render)
//
// Centraliza label, cor e ícone aqui para que Fase 2 apenas consuma
// sem replicar lógica de mapeamento em múltiplos componentes.
// ─────────────────────────────────────────────────────────────────────────────

export interface LogDisplayMeta {
  /** Rótulo legível por humanos */
  label:        string;
  /** Sublabel contextual (ex: "Mama esquerda · 15min") */
  sublabel:     string;
  /** Emoji representativo */
  emoji:        string;
  /** Duração formatada, ou null se sem end_time */
  duration:     string | null;
  /**
   * Cor semântica — usa os tokens do DS (sem hex hardcoded).
   * Mapeia para os tokens CSS: 'success' | 'info' | 'warning' | 'neutral'
   */
  colorToken:   'success' | 'info' | 'warning' | 'neutral';
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GUARDS DE TIPO — narrowing seguro do payload opaco vindo do JSONB
//
// Retornam `boolean` e fazem o TypeScript narrowar o tipo no bloco `if`.
// Usados nos hooks após receber o `Json` do Supabase.
// ─────────────────────────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isSleepPayload(v: unknown): v is SleepPayload {
  return isRecord(v) && v['logType'] === 'sleep';
}

export function isFeedPayload(v: unknown): v is FeedPayload {
  return isRecord(v) && v['logType'] === 'feed';
}

export function isDiaperPayload(v: unknown): v is DiaperPayload {
  return isRecord(v) && v['logType'] === 'diaper';
}

export function isNotePayload(v: unknown): v is NotePayload {
  return isRecord(v) && v['logType'] === 'note';
}

/**
 * Deserializa o payload opaco `Json` do Supabase para `RoutinePayload`.
 * Retorna `null` se o JSONB estiver malformado — o hook trata o fallback.
 */
export function parseRoutinePayload(raw: unknown): RoutinePayload | null {
  if (isSleepPayload(raw))  return raw;
  if (isFeedPayload(raw))   return raw;
  if (isDiaperPayload(raw)) return raw;
  if (isNotePayload(raw))   return raw;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CALCULADORA DE DISPLAY META — lógica pura, sem efeitos colaterais
// ─────────────────────────────────────────────────────────────────────────────

/** Formata duração em minutos para string legível */
function formatDuration(start: string, end: string | null): string | null {
  if (!end) return null;
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs <= 0) return null;
  const totalMin = Math.round(diffMs / 60_000);
  if (totalMin < 60) return `${totalMin}min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function buildLogDisplayMeta(log: RoutineLogWithPayload): LogDisplayMeta {
  const { payload, start_time, end_time } = log;
  const duration = formatDuration(start_time, end_time);

  switch (payload.logType) {
    case 'sleep': {
      const qualityLabel = payload.quality === 'good'
        ? 'Sono tranquilo'
        : payload.quality === 'fair'
        ? 'Sono leve'
        : payload.quality === 'poor'
        ? 'Sono agitado'
        : 'Soninho';
      const locationLabel = payload.location ? ` · ${payload.location}` : '';
      return {
        label:      'Sono',
        sublabel:   `${qualityLabel}${locationLabel}`,
        emoji:      '😴',
        duration,
        colorToken: 'info',
      };
    }

    case 'feed': {
      const methodLabel: Record<FeedPayload['method'], string> = {
        breast:  'Mama',
        bottle:  'Mamadeira',
        solid:   'Sólidos',
        mixed:   'Misto',
      };
      const sideLabel = payload.side === 'left' ? ' esquerda'
        : payload.side === 'right' ? ' direita'
        : payload.side === 'both'  ? ' (ambos)'
        : '';
      const volumeLabel = payload.amount_ml ? ` · ${payload.amount_ml}ml` : '';
      return {
        label:      'Alimentação',
        sublabel:   `${methodLabel[payload.method]}${sideLabel}${volumeLabel}`,
        emoji:      payload.method === 'breast' ? '🤱' : payload.method === 'solid' ? '🥣' : '🍼',
        duration,
        colorToken: 'success',
      };
    }

    case 'diaper': {
      const contentLabel: Record<DiaperPayload['content'], string> = {
        wet:   'Molhada',
        dirty: 'Suja',
        both:  'Molhada e suja',
        dry:   'Seca',
      };
      return {
        label:      'Fralda',
        sublabel:   contentLabel[payload.content],
        emoji:      '👶',
        duration:   null,  // fraldas não têm duração
        colorToken: 'warning',
      };
    }

    case 'note': {
      const moodLabel = payload.mood === 'happy'   ? 'Feliz'
        : payload.mood === 'calm'    ? 'Calmo'
        : payload.mood === 'fussy'   ? 'Agitado'
        : payload.mood === 'crying'  ? 'Chorando'
        : payload.mood === 'sleepy'  ? 'Sonolento'
        : '';
      return {
        label:      'Anotação',
        sublabel:   moodLabel || 'Nota livre',
        emoji:      '📝',
        duration:   null,
        colorToken: 'neutral',
      };
    }
  }
}
