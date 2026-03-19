/**
 * Ninho Analytics — Event Architecture v1
 *
 * PURPOSE: Append-only behavioral event layer, separate from domain tables.
 * Domain tables are source of truth for product state.
 * This module records WHAT the caregiver did, WHEN, and FROM WHERE.
 *
 * NAMING CONVENTION
 *   event_name  → Title Case (e.g. "Vaccine Confirmed")
 *   properties  → snake_case
 *   one event per business action (not per button tap)
 *   use source/module/screen to differentiate context
 *
 * TRACKING PLAN — minimum event set:
 *
 * Navigation
 *   Screen Viewed             screen_name, child_id
 *   Child Switched            from_child_id, to_child_id
 *
 * Assistant / Priority
 *   Assistant Shown           priority_level, item_id
 *   Assistant CTA Clicked     item_id, path
 *   Attention Item Shown      item_id, priority_level
 *   Attention Item Clicked    item_id, path
 *
 * Quick Actions
 *   Quick Action Opened       source (fab | shortcut)
 *   Quick Action Selected     action_id, label
 *
 * Routine Events
 *   Feeding Session Started   session_type (breastfeed | bottle), child_id
 *   Feeding Session Paused    session_id, elapsed_seconds
 *   Feeding Session Resumed   session_id
 *   Feeding Session Ended     session_id, elapsed_seconds, side
 *   Feeding Log Saved         session_type, child_id, duration_seconds, source
 *   Bottle Log Saved          volume_ml, child_id, source
 *   Sleep Log Saved           duration_seconds, child_id, source
 *   Diaper Log Saved          condition, child_id, source
 *   Note Log Saved            child_id, source (routine | health | report)
 *
 * Health Events
 *   Vaccine Confirm Flow Opened   vaccine_id, vaccine_name
 *   Vaccine Confirmed             vaccine_id, vaccine_name, applied_date
 *   Vaccine Manual Add Started    (no extra props needed)
 *   Vaccine Manual Add Saved      vaccine_name, child_id
 *   Consultation Create Started   (no extra props)
 *   Consultation Saved            child_id, has_doctor, has_specialty
 *   Symptom Saved                 symptom_count, has_note, child_id
 *   Medication Saved              is_active, has_dosage, child_id
 *   Growth Measurement Saved      has_weight, has_height, child_id
 *   Medical Report Note Saved     child_id
 *   Milestone Marked              milestone_id, domain, age_bucket
 *
 * Errors
 *   Save Failed                   entity, error_message, screen_name
 *   Validation Error Shown        entity, field, screen_name
 *
 * Child / Family
 *   Child Profile Field Completed field_name
 *   Onboarding Completed          (no extra props)
 *   Family Created                (no extra props)
 *   Child Created                 (no extra props)
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Environment helpers ────────────────────────────────────────────────────

const APP_VERSION = '1.0.0';
const ENVIRONMENT = import.meta.env.MODE ?? 'development';

// Session ID — stable for the current browser session
const SESSION_ID = (() => {
  let sid = sessionStorage.getItem('ninho_session_id');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('ninho_session_id', sid);
  }
  return sid;
})();

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NinhoEvent {
  event_name: string;
  event_version?: number;
  occurred_at?: string;
  user_id?: string;
  family_id?: string;
  child_id?: string;
  screen_name?: string;
  source?: string;
  module?: string;
  environment?: string;
  app_version?: string;
  session_id?: string;
  properties?: Record<string, unknown>;
  save_status?: 'success' | 'error';
  error_code?: string;
}

// ─── Event names (type-safe constants) ──────────────────────────────────────

export const EVENTS = {
  // Navigation
  SCREEN_VIEWED:             'Screen Viewed',
  CHILD_SWITCHED:            'Child Switched',

  // Assistant
  ASSISTANT_SHOWN:           'Assistant Shown',
  ASSISTANT_CTA_CLICKED:     'Assistant CTA Clicked',
  ATTENTION_ITEM_SHOWN:      'Attention Item Shown',
  ATTENTION_ITEM_CLICKED:    'Attention Item Clicked',

  // Quick Actions
  QUICK_ACTION_OPENED:       'Quick Action Opened',
  QUICK_ACTION_SELECTED:     'Quick Action Selected',

  // Routine
  FEEDING_SESSION_STARTED:   'Feeding Session Started',
  FEEDING_SESSION_PAUSED:    'Feeding Session Paused',
  FEEDING_SESSION_RESUMED:   'Feeding Session Resumed',
  FEEDING_SESSION_ENDED:     'Feeding Session Ended',
  FEEDING_LOG_SAVED:         'Feeding Log Saved',
  BOTTLE_LOG_SAVED:          'Bottle Log Saved',
  SLEEP_LOG_SAVED:           'Sleep Log Saved',
  DIAPER_LOG_SAVED:          'Diaper Log Saved',
  NOTE_LOG_SAVED:            'Note Log Saved',

  // Health
  VACCINE_CONFIRM_OPENED:    'Vaccine Confirm Flow Opened',
  VACCINE_CONFIRMED:         'Vaccine Confirmed',
  VACCINE_MANUAL_STARTED:    'Vaccine Manual Add Started',
  VACCINE_MANUAL_SAVED:      'Vaccine Manual Add Saved',
  CONSULTATION_STARTED:      'Consultation Create Started',
  CONSULTATION_SAVED:        'Consultation Saved',
  SYMPTOM_SAVED:             'Symptom Saved',
  MEDICATION_SAVED:          'Medication Saved',
  GROWTH_SAVED:              'Growth Measurement Saved',
  REPORT_NOTE_SAVED:         'Medical Report Note Saved',
  MILESTONE_MARKED:          'Milestone Marked',

  // Child / Family
  PROFILE_FIELD_COMPLETED:   'Child Profile Field Completed',
  ONBOARDING_COMPLETED:      'Onboarding Completed',
  FAMILY_CREATED:            'Family Created',
  CHILD_CREATED:             'Child Created',

  // Errors
  SAVE_FAILED:               'Save Failed',
  VALIDATION_ERROR:          'Validation Error Shown',
} as const;

// ─── Context state (set once per session on auth + child load) ───────────────

let _userId: string | null = null;
let _familyId: string | null = null;
let _childId: string | null = null;

export function setAnalyticsContext(ctx: { userId?: string; familyId?: string; childId?: string }) {
  if (ctx.userId)   _userId   = ctx.userId;
  if (ctx.familyId) _familyId = ctx.familyId;
  if (ctx.childId)  _childId  = ctx.childId;
}

// ─── Track function ─────────────────────────────────────────────────────────

/**
 * track — fire an analytics event.
 *
 * In production this sends to Supabase health_events as append-only behavioral records.
 * The event is also logged in dev mode.
 *
 * IMPORTANT: This must NEVER block the UI. All errors are swallowed silently.
 */
export async function track(
  event_name: string,
  properties?: Record<string, unknown>,
  overrides?: Partial<NinhoEvent>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? _userId;

    if (!uid) return; // Don't track unauthenticated events for now

    const payload: NinhoEvent = {
      event_name,
      event_version: 1,
      occurred_at:   new Date().toISOString(),
      user_id:       uid,
      family_id:     _familyId ?? undefined,
      child_id:      _childId ?? undefined,
      session_id:    SESSION_ID,
      environment:   ENVIRONMENT,
      app_version:   APP_VERSION,
      properties:    properties ?? {},
      ...overrides,
    };

    if (ENVIRONMENT !== 'production') {
      // Dev / staging: log to console for easy inspection
      // eslint-disable-next-line no-console
      console.debug('[ninho:event]', event_name, payload);
    }

    // Store in health_events as append-only behavioral log
    await supabase.from('health_events').insert({
      child_id:   uid, // fallback — ideally always override with actual child_id
      author_id:  uid,
      event_type: event_name,
      severity:   'low',
      payload:    payload as Record<string, unknown>,
    });
  } catch {
    // Never throw — analytics must never break the product
  }
}

/**
 * trackScreen — convenience for Screen Viewed events.
 */
export function trackScreen(screen_name: string, extra?: Record<string, unknown>) {
  track(EVENTS.SCREEN_VIEWED, { screen_name, ...extra });
}

/**
 * trackSaveFailed — convenience for Save Failed events.
 */
export function trackSaveFailed(entity: string, error_message: string, screen_name?: string) {
  track(EVENTS.SAVE_FAILED, { entity, error_message, screen_name }, { save_status: 'error' });
}
