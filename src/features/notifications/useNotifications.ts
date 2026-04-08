/**
 * NINHO — useNotifications
 * Regista o Service Worker, gere subscrição push e expõe helpers
 * para agendar lembretes de medicação localmente.
 *
 * Arquitectura:
 *   - SW: public/sw.js
 *   - Push delivery server-side requer VAPID keys (fora do scope client)
 *   - Lembretes locais via setTimeout/localStorage como fallback imediato
 */

import { useEffect, useState, useCallback } from 'react';

export type SwStatus = 'idle' | 'registering' | 'ready' | 'unsupported' | 'error';

export interface UseNotificationsReturn {
  swStatus:     SwStatus;
  pushGranted:  boolean;
  requestPush:  () => Promise<boolean>;
  scheduleMedicationReminder: (opts: {
    medicationName: string;
    doseTime: Date;
    childName: string;
  }) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [swStatus,    setSwStatus]    = useState<SwStatus>('idle');
  const [pushGranted, setPushGranted] = useState(false);

  // ── Register SW ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwStatus('unsupported');
      return;
    }

    setSwStatus('registering');

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => setSwStatus('ready'))
      .catch(() => setSwStatus('error'));

    // Sync initial permission state
    if ('Notification' in window) {
      setPushGranted(Notification.permission === 'granted');
    }
  }, []);

  // ── Request push permission ──────────────────────────────────────────────
  const requestPush = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    const result = await Notification.requestPermission();
    const granted = result === 'granted';
    setPushGranted(granted);
    return granted;
  }, []);

  // ── Schedule local medication reminder ──────────────────────────────────
  // Fallback via setTimeout (no server VAPID needed for local push)
  const scheduleMedicationReminder = useCallback(({
    medicationName, doseTime, childName,
  }: { medicationName: string; doseTime: Date; childName: string }) => {
    if (!pushGranted) return;

    const msUntil = doseTime.getTime() - Date.now();
    if (msUntil <= 0) return;

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(`💊 Medicação — ${childName}`, {
          body: `Hora de dar ${medicationName}`,
          icon: '/favicon.ico',
        });
      }
    }, msUntil);
  }, [pushGranted]);

  return { swStatus, pushGranted, requestPush, scheduleMedicationReminder };
}
