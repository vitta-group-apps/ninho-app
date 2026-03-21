/**
 * SaudePage — Ninho Health Care Hub v5
 *
 * Architecture: vertical expandable care modules — zero horizontal tab dependency.
 * Growth rebuilt as a longitudinal dashboard with charts and delta tracking.
 *
 * Structure:
 *   1. Header: child context + age phase
 *   2. Health overview: 4 status stats (growth shows actual weight/height)
 *   3. Attention / priority layer
 *   4. Vertical expandable sections:
 *      - Vacinas (SUS + complementares + manuais)
 *      - Consultas
 *      - Sintomas
 *      - Medicamentos
 *      - Crescimento (longitudinal dashboard with charts + delta)
 *      - Relatório médico
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon, ChevronRightIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Dot,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { InlineStatusPill, SectionLabel } from '@/components/ds';
import { toast } from '@/hooks/use-toast';
import { getAgeContext } from '@/lib/eventSystem';
import { vaccineSchedule, type VaccineEntry } from '@/data/vaccineSchedule';
import { Skeleton } from '@/components/ui/skeleton';

// ── Cores fixas do design system — sem color-mix, sem hsl(var()) ──
const SAGE         = '#789687';
const AMBER        = '#C8894A';
const AMBER_BG     = '#FDF3E9';
const AMBER_BORDER = '#f0d5b0';
const MAUVE        = '#806e84';
const SAGE_BG      = '#ebf0ed';
const SAGE_BORDER  = '#ccd9d3';
const SAGE_LIGHT   = '#f0f5f2';
const MAUVE_BG     = '#f4f0f3';
const MAUVE_BORDER = '#e3d9e2';
const MUTED_BG     = '#E8E8E2';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#E5E0D8';
const TXT          = '#2C2C2C';
const TXT_MUTED    = '#7A7A7A';
const PAGE_BG      = '#F8F5F0';

const COMPLEMENTARY_VACCINES: {
  name: string;
  description: string;
  ageHint: string;
  requiresPediatricGuidance: boolean;
}[] = [
  {
    name: 'Meningocócica B (MenB)',
    description: 'Proteção adicional contra meningite B. Não disponível no SUS — rede particular.',
    ageHint: 'A partir de 2 meses',
    requiresPediatricGuidance: true,
  },
  {
    name: 'Pneumocócica 13-valente (Prevenar 13)',
    description: 'Cobertura mais ampla que a Pneumo 10 do SUS. Indicação pediátrica.',
    ageHint: 'A partir de 2 meses',
    requiresPediatricGuidance: true,
  },
  {
    name: 'Varicela 2ª dose antecipada',
    description: 'Reforço antecipado disponível na rede particular.',
    ageHint: '15 meses',
    requiresPediatricGuidance: false,
  },
  {
    name: 'Hepatite A 2ª dose',
    description: 'Complementar ao calendário SUS, conforme indicação pediátrica.',
    ageHint: '18–24 meses',
    requiresPediatricGuidance: false,
  },
  {
    name: 'Influenza anual (particular)',
    description: 'Disponível no SUS em campanha. Rede particular disponível fora do período.',
    ageHint: 'Anual, a partir de 6 meses',
    requiresPediatricGuidance: false,
  },
  {
    name: 'Rotavírus pentavalente (RotaTeq)',
    description: 'Alternativa com cobertura mais ampla de cepas. Rede particular.',
    ageHint: 'A partir de 6 semanas',
    requiresPediatricGuidance: true,
  },
];

function computeVaccineState(ageMonths: number, appliedVaccineIds: Set<string>) {
  const due = vaccineSchedule.filter(v => {
    const vm = v.ageMonths ?? 0;
    return vm <= ageMonths && !appliedVaccineIds.has(v.id);
  });
  const applied = vaccineSchedule.filter(v => appliedVaccineIds.has(v.id));
  const upcoming = vaccineSchedule.filter(v => {
    const vm = v.ageMonths ?? 0;
    return vm > ageMonths && vm <= ageMonths + 3 && !appliedVaccineIds.has(v.id);
  });
  const future = vaccineSchedule.filter(v => {
    const vm = v.ageMonths ?? 0;
    return vm > ageMonths + 3;
  });
  return { applied, due, upcoming, future };
}

const SYMPTOM_CHIPS = [
  { emoji: '🌡️', label: 'Febre' },
  { emoji: '😮‍💨', label: 'Tosse' },
  { emoji: '🤧', label: 'Coriza' },
  { emoji: '🤢', label: 'Vômito' },
  { emoji: '💩', label: 'Diarreia' },
  { emoji: '😭', label: 'Choro intenso' },
  { emoji: '😴', label: 'Sonolência' },
  { emoji: '🍽️', label: 'Sem apetite' },
  { emoji: '🔴', label: 'Assadura' },
  { emoji: '😤', label: 'Irritabilidade' },
  { emoji: '😰', label: 'Dificuldade respiratória' },
  { emoji: '🤲', label: 'Erupção cutânea' },
];

function OverviewStat({
  emoji, label, value, sub, color, onTap, urgent,
}: {
  emoji: string; label: string; value: string;
  sub: string; color: string; onTap?: () => void; urgent?: boolean;
}) {
  return (
    <button
      onClick={onTap}
      className="rounded-2xl p-3 text-left w-full transition-all active:scale-[0.98]"
      style={{
        backgroundColor: urgent ? AMBER_BG : CARD_BG,
        border: `1px solid ${urgent ? AMBER_BORDER : CARD_BORDER}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[15px]">{emoji}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest font-nunito leading-none"
          style={{ color: TXT_MUTED }}>
          {label}
        </p>
      </div>
      <p className="text-[22px] font-bold font-quicksand leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] font-nunito mt-1 leading-tight" style={{ color: TXT_MUTED }}>
        {sub}
      </p>
    </button>
  );
}

function PriorityCard({
  emoji, title, body, ctaLabel, onCta,
}: {
  emoji: string; title: string; body: string;
  ctaLabel?: string; onCta?: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
      style={{ backgroundColor: AMBER_BG, border: `1px solid ${AMBER_BORDER}` }}
    >
      <span className="text-[18px] mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand leading-snug" style={{ color: TXT }}>
          {title}
        </p>
        <p className="text-[12px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>
          {body}
        </p>
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="text-[11px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 self-center transition-all active:scale-95"
          style={{ backgroundColor: AMBER }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

function ExpandableSection({
  id, emoji, title, statusPill, summary, open, onToggle, children,
}: {
  id: string; emoji: string; title: string;
  statusPill?: React.ReactNode; summary?: string;
  open: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? MAUVE_BG : 'transparent' }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
          style={{ backgroundColor: MUTED_BG }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>{title}</p>
            {statusPill}
          </div>
          {summary && (
            <p className="text-[11px] font-nunito mt-0.5 line-clamp-1" style={{ color: TXT_MUTED }}>
              {summary}
            </p>
          )}
        </div>
        <div className="flex-shrink-0" style={{ color: TXT_MUTED }}>
          {open ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`${id}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-3 space-y-4"
              style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function VaccineConfirmModal({
  vaccine, childId, userId, onClose, onConfirmed,
}: {
  vaccine: VaccineEntry; childId: string; userId: string;
  onClose: () => void;
  onConfirmed: (vaccineId: string, date: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [appliedDate, setAppliedDate] = useState(today);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (!appliedDate) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('health_logs').insert({
        child_id:    childId,
        author_id:   userId,
        type:        'vaccine',
        occurred_at: new Date(appliedDate + 'T12:00:00').toISOString(),
        details: {
          type:          'vaccine_confirmation',
          vaccine_id:    vaccine.id,
          vaccine_name:  vaccine.shortName,
          vaccine_label: vaccine.name,
          diseases:      vaccine.diseases,
          doses:         vaccine.doses ?? null,
          applied_on:    appliedDate,
          source:        'manual_confirm',
        },
      });
      if (error) throw error;
      onConfirmed(vaccine.id, appliedDate);
      toast({ title: `✅ ${vaccine.shortName} confirmada` });
      onClose();
    } catch (e) {
      console.error('[vaccine confirm]', e);
      toast({ title: 'Erro ao confirmar vacina', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: CARD_BG }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: CARD_BORDER }} />
        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>
                Confirmar aplicação
              </p>
              <p className="text-[12px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                {vaccine.shortName}{vaccine.doses ? ` · ${vaccine.doses}` : ''}
              </p>
            </div>
            <button onClick={onClose} style={{ color: TXT_MUTED }}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: MUTED_BG }}>
            <p className="text-[12px] font-nunito leading-snug" style={{ color: TXT_MUTED }}>
              {vaccine.diseases}
            </p>
            <p className="text-[11px] font-bold font-nunito mt-1.5" style={{ color: SAGE }}>
              Prevista: {vaccine.ageLabel}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-2"
              style={{ color: TXT_MUTED }}>
              Data de aplicação
            </p>
            <input
              type="date" value={appliedDate} max={today}
              onChange={e => setAppliedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito outline-none transition-colors"
              style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
            />
          </div>

          <p className="text-[11px] font-nunito leading-snug" style={{ color: TXT_MUTED }}>
            Ao confirmar, esta vacina será registrada no histórico de {vaccine.shortName} desta criança.
          </p>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{ backgroundColor: MUTED_BG, color: TXT_MUTED, border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={confirm} disabled={saving || !appliedDate}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Salvando…' : 'Confirmar vacina'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function VaccineRow({
  vaccine, state, onConfirm, appliedDate,
}: {
  vaccine: VaccineEntry;
  state: 'applied' | 'due' | 'upcoming' | 'future';
  onConfirm?: (v: VaccineEntry) => void;
  appliedDate?: string;
}) {
  const stateConfig = {
    applied:  { color: SAGE,     label: 'Aplicada',   bg: SAGE_BG },
    due:      { color: AMBER,    label: 'A confirmar', bg: AMBER_BG },
    upcoming: { color: MAUVE,    label: 'Próxima',     bg: MAUVE_BG },
    future:   { color: TXT_MUTED, label: 'Futura',     bg: MUTED_BG },
  }[state];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${state === 'future' ? 'opacity-55' : ''}`}
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] flex-shrink-0"
        style={{ backgroundColor: stateConfig.bg }}>
        {state === 'applied' ? '✓' : '💉'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
          {vaccine.shortName}
          {vaccine.doses && (
            <span className="font-normal" style={{ color: TXT_MUTED }}> · {vaccine.doses}</span>
          )}
        </p>
        <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
          {state === 'applied' && appliedDate
            ? `Aplicada em ${new Date(appliedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
            : vaccine.ageLabel}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <InlineStatusPill
          label={stateConfig.label}
          variant={state === 'applied' ? 'active' : 'paused'}
          color={stateConfig.color}
        />
        {(state === 'due' || state === 'upcoming') && onConfirm && (
          <button onClick={() => onConfirm(vaccine)}
            className="text-[10px] font-bold font-nunito px-2 py-1 rounded-xl text-white transition-all active:scale-95"
            style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
            Confirmar
          </button>
        )}
      </div>
    </div>
  );
}

function ConsultationModal({
  childId, userId, onClose, onSaved,
}: {
  childId: string; userId: string; onClose: () => void;
  onSaved: (entry: { id: string; doctor: string; specialty: string; date: string; note: string }) => void;
}) {
  const [form, setForm] = useState({ doctor: '', specialty: '', date: '', note: '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.date) { toast({ title: 'Informe a data da consulta', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('health_logs').insert({
        child_id: childId, author_id: userId, type: 'note',
        occurred_at: new Date(form.date + 'T00:00:00').toISOString(),
        details: { type: 'consultation', doctor: form.doctor.trim() || null, specialty: form.specialty.trim() || null, note: form.note.trim() || null, date: form.date },
      }).select('id').single();
      if (error) throw error;
      onSaved({ id: data.id, ...form });
      toast({ title: '🩺 Consulta registrada' });
      onClose();
    } catch {
      toast({ title: 'Erro ao salvar consulta', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    backgroundColor: MUTED_BG,
    border: `1.5px solid ${CARD_BORDER}`,
    borderRadius: 12, color: TXT,
    fontFamily: 'Nunito, sans-serif',
    fontSize: 13, width: '100%',
    padding: '12px 16px', outline: 'none',
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: CARD_BG }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: CARD_BORDER }} />
        <div className="px-5 pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>Registrar consulta</p>
            <button onClick={onClose} style={{ color: TXT_MUTED }}><XMarkIcon className="w-5 h-5" /></button>
          </div>
          {[
            { label: 'Data da consulta *', key: 'date', type: 'date', placeholder: '' },
            { label: 'Médico (opcional)', key: 'doctor', type: 'text', placeholder: 'Nome do médico' },
            { label: 'Especialidade (opcional)', key: 'specialty', type: 'text', placeholder: 'Ex: Pediatria...' },
          ].map(f => (
            <div key={f.key}>
              <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-1.5" style={{ color: TXT_MUTED }}>
                {f.label}
              </p>
              <input type={f.type} placeholder={f.placeholder}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-1.5" style={{ color: TXT_MUTED }}>
              Observações (opcional)
            </p>
            <textarea rows={2} placeholder="Ex: retorno de 3 meses..."
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{ backgroundColor: MUTED_BG, color: TXT_MUTED, border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving || !form.date}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Salvando…' : 'Registrar consulta'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function MedicationModal({
  childId, userId, onClose, onSaved,
}: {
  childId: string; userId: string; onClose: () => void;
  onSaved: (entry: { id: string; name: string; dosage: string; frequency: string; startDate: string; note: string; active: boolean }) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', startDate: today, note: '', active: true });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) { toast({ title: 'Informe o nome do medicamento', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('health_logs').insert({
        child_id: childId, author_id: userId, type: 'medication',
        occurred_at: new Date(form.startDate + 'T00:00:00').toISOString(),
        details: { type: 'medication', name: form.name.trim(), dosage: form.dosage.trim() || null, frequency: form.frequency.trim() || null, start_date: form.startDate, note: form.note.trim() || null, active: form.active },
      }).select('id').single();
      if (error) throw error;
      onSaved({ id: data.id, ...form });
      toast({ title: '💊 Medicamento registrado' });
      onClose();
    } catch {
      toast({ title: 'Erro ao salvar medicamento', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`,
    borderRadius: 12, color: TXT, fontFamily: 'Nunito, sans-serif',
    fontSize: 13, width: '100%', padding: '12px 16px', outline: 'none',
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: CARD_BG }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: CARD_BORDER }} />
        <div className="px-5 pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>Adicionar medicamento</p>
            <button onClick={onClose} style={{ color: TXT_MUTED }}><XMarkIcon className="w-5 h-5" /></button>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-1.5" style={{ color: TXT_MUTED }}>
              Medicamento *
            </p>
            <input type="text" placeholder="Ex: Paracetamol, Dipirona..."
              value={form.name} autoFocus
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Dose', key: 'dosage', placeholder: 'Ex: 200mg' },
              { label: 'Frequência', key: 'frequency', placeholder: 'Ex: 6/6h' },
            ].map(f => (
              <div key={f.key}>
                <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-1.5" style={{ color: TXT_MUTED }}>
                  {f.label}
                </p>
                <input type="text" placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-1.5" style={{ color: TXT_MUTED }}>
              Data de início
            </p>
            <input type="date" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>Medicamento ativo</p>
              <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>Em uso atualmente</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className="w-12 h-6 rounded-full transition-all"
              style={{ backgroundColor: form.active ? SAGE : MUTED_BG, border: 'none', cursor: 'pointer' }}>
              <div className="w-5 h-5 rounded-full bg-white transition-all mx-0.5"
                style={{ transform: form.active ? 'translateX(24px)' : 'translateX(0)' }} />
            </button>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-1.5" style={{ color: TXT_MUTED }}>
              Observações (opcional)
            </p>
            <textarea rows={2} placeholder="Ex: para febre acima de 38°C..."
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{ backgroundColor: MUTED_BG, color: TXT_MUTED, border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving || !form.name.trim()}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Salvando…' : 'Salvar medicamento'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

interface GrowthEntry { id: string; weight?: number; height?: number; note?: string; date: Date; }
interface SymptomEntry { id: string; symptoms: string[]; note?: string; date: Date; }
interface NoteEntry { id?: string; text: string; date: Date; }
interface ConsultationEntry { id: string; doctor: string; specialty: string; date: string; note: string; }
interface MedicationEntry { id: string; name: string; dosage: string; frequency: string; startDate: string; note: string; active: boolean; }

export default function SaudePage() {
  const { user } = useAuth();
  const { activeChild } = useActiveChild();
  const childName = activeChild?.name ?? 'seu filho';
  const ageCtx    = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const ageMonths = ageCtx?.months ?? 0;

  const [appliedVaccineIds, setAppliedVaccineIds]     = useState<Set<string>>(new Set());
  const [appliedVaccineDates, setAppliedVaccineDates] = useState<Record<string, string>>({});
  const vaccineState = computeVaccineState(ageMonths, appliedVaccineIds);

  const [openSection, setOpenSection] = useState<string | null>(null);
  function toggle(id: string) { setOpenSection(prev => prev === id ? null : id); }
  function openAndScroll(id: string) {
    setOpenSection(id);
    setTimeout(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function fmtWeight(w: number): string {
    if (w >= 1000) return `${(w / 1000).toFixed(2)} kg`;
    return `${w} kg`;
  }
  function fmtWeightDelta(d: number, asG: boolean): string {
    if (asG) return `${Math.abs(d / 1000).toFixed(2)} kg`;
    return `${Math.abs(d)} kg`;
  }

  const [showAllDue, setShowAllDue]           = useState(false);
  const [showFuture, setShowFuture]           = useState(false);
  const [showComplementary, setShowComplementary] = useState(false);
  const [confirmVaccine, setConfirmVaccine]   = useState<VaccineEntry | null>(null);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showMedModal, setShowMedModal]       = useState(false);

  const [growthHistory, setGrowthHistory]     = useState<GrowthEntry[]>([]);
  const [symptomHistory, setSymptomHistory]   = useState<SymptomEntry[]>([]);
  const [savedNotes, setSavedNotes]           = useState<NoteEntry[]>([]);
  const [consultations, setConsultations]     = useState<ConsultationEntry[]>([]);
  const [medications, setMedications]         = useState<MedicationEntry[]>([]);

  const [growthForm, setGrowthForm]     = useState<{ weight?: string; height?: string; note?: string }>({});
  const [growthSaving, setGrowthSaving] = useState(false);
  const [loggedSymptoms, setLoggedSymptoms] = useState<string[]>([]);
  const [symptomNote, setSymptomNote]   = useState('');
  const [symptomSaving, setSymptomSaving] = useState(false);
  const [quickNote, setQuickNote]       = useState('');
  const [savingNote, setSavingNote]     = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [dbLoading, setDbLoading]       = useState(true);

  const loadData = useCallback(async () => {
    if (!activeChild) { setDbLoading(false); return; }
    setDbLoading(true);
    try {
      const { data: healthData } = await supabase
        .from('health_logs').select('*').eq('child_id', activeChild.id)
        .order('occurred_at', { ascending: false }).limit(100);

      const notes: NoteEntry[] = [], growth: GrowthEntry[] = [], symptoms: SymptomEntry[] = [];
      const consults: ConsultationEntry[] = [], meds: MedicationEntry[] = [];

      for (const row of (healthData ?? [])) {
        const d = (row.details ?? {}) as Record<string, unknown>;
        if (d.source === 'report' && typeof d.note === 'string') {
          notes.push({ id: row.id, text: d.note, date: new Date(row.occurred_at) });
        } else if (d.type === 'growth') {
          growth.push({ id: row.id, weight: typeof d.weight_kg === 'number' ? d.weight_kg : undefined, height: typeof d.height_cm === 'number' ? d.height_cm : undefined, note: typeof d.note === 'string' ? d.note : undefined, date: new Date(row.occurred_at) });
        } else if (d.type === 'symptom' && Array.isArray(d.symptoms)) {
          symptoms.push({ id: row.id, symptoms: d.symptoms as string[], note: typeof d.note === 'string' ? d.note : undefined, date: new Date(row.occurred_at) });
        } else if (d.type === 'consultation') {
          consults.push({ id: row.id, doctor: typeof d.doctor === 'string' ? d.doctor : '', specialty: typeof d.specialty === 'string' ? d.specialty : '', date: typeof d.date === 'string' ? d.date : '', note: typeof d.note === 'string' ? d.note : '' });
        } else if (d.type === 'medication') {
          meds.push({ id: row.id, name: typeof d.name === 'string' ? d.name : '', dosage: typeof d.dosage === 'string' ? d.dosage : '', frequency: typeof d.frequency === 'string' ? d.frequency : '', startDate: typeof d.start_date === 'string' ? d.start_date : '', note: typeof d.note === 'string' ? d.note : '', active: d.active !== false });
        }
      }

      setSavedNotes(notes); setGrowthHistory(growth); setSymptomHistory(symptoms);
      setConsultations(consults); setMedications(meds);

      const vaccineEntries = (healthData ?? []).filter(r => r.type === 'vaccine' && (r.details as Record<string, unknown>)?.type === 'vaccine_confirmation');
      const appliedIds = new Set<string>();
      const appliedDates: Record<string, string> = {};
      for (const entry of vaccineEntries) {
        const d = (entry.details ?? {}) as Record<string, unknown>;
        if (typeof d.vaccine_id === 'string') {
          appliedIds.add(d.vaccine_id);
          if (typeof d.applied_on === 'string') appliedDates[d.vaccine_id] = d.applied_on;
        }
      }
      setAppliedVaccineIds(appliedIds);
      setAppliedVaccineDates(appliedDates);
    } finally {
      setDbLoading(false);
    }
  }, [activeChild]);

  useEffect(() => { loadData(); }, [loadData]);

  async function saveQuickNote() {
    if (!quickNote.trim() || !activeChild || !user) return;
    setSavingNote(true);
    try {
      const now = new Date();
      const { data, error } = await supabase.from('health_logs').insert({
        child_id: activeChild.id, author_id: user.id, type: 'note', occurred_at: now.toISOString(),
        details: { note: quickNote.trim(), source: 'report' },
      }).select('id').single();
      if (error) throw error;
      setSavedNotes(prev => [{ id: data?.id, text: quickNote.trim(), date: now }, ...prev]);
      setQuickNote(''); setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2500);
      toast({ title: '📋 Nota salva no relatório' });
    } catch { toast({ title: 'Erro ao salvar nota', variant: 'destructive' }); }
    finally { setSavingNote(false); }
  }

  async function saveGrowthMeasurement() {
    if (!activeChild || !user || (!growthForm.weight && !growthForm.height)) return;
    setGrowthSaving(true);
    try {
      const now = new Date();
      const { data, error } = await supabase.from('health_logs').insert({
        child_id: activeChild.id, author_id: user.id, type: 'note', occurred_at: now.toISOString(),
        details: { type: 'growth', weight_kg: growthForm.weight ? parseFloat(growthForm.weight) : null, height_cm: growthForm.height ? parseFloat(growthForm.height) : null, note: growthForm.note ?? null },
      }).select('id').single();
      if (error) throw error;
      setGrowthHistory(prev => [{ id: data?.id ?? '', weight: growthForm.weight ? parseFloat(growthForm.weight) : undefined, height: growthForm.height ? parseFloat(growthForm.height) : undefined, note: growthForm.note, date: now }, ...prev]);
      setGrowthForm({});
      toast({ title: '📏 Medição salva' });
    } catch { toast({ title: 'Erro ao salvar medição', variant: 'destructive' }); }
    finally { setGrowthSaving(false); }
  }

  async function saveSymptoms() {
    if (!activeChild || !user || loggedSymptoms.length === 0) return;
    setSymptomSaving(true);
    try {
      const now = new Date();
      const { data, error } = await supabase.from('health_logs').insert({
        child_id: activeChild.id, author_id: user.id, type: 'note', occurred_at: now.toISOString(),
        details: { type: 'symptom', symptoms: loggedSymptoms, note: symptomNote.trim() || null },
      }).select('id').single();
      if (error) throw error;
      setSymptomHistory(prev => [{ id: data?.id ?? '', symptoms: [...loggedSymptoms], note: symptomNote.trim() || undefined, date: now }, ...prev]);
      setLoggedSymptoms([]); setSymptomNote('');
      toast({ title: '🌡️ Sintomas registrados' });
    } catch { toast({ title: 'Erro ao salvar sintomas', variant: 'destructive' }); }
    finally { setSymptomSaving(false); }
  }

  const priorityItems: { emoji: string; title: string; body: string; cta: string; sectionId: string }[] = [];
  if (vaccineState.due.length > 0) {
    const first = vaccineState.due[0];
    priorityItems.push({ emoji: '💉', title: `${vaccineState.due.length} vacina${vaccineState.due.length > 1 ? 's' : ''} a confirmar`, body: `${first.shortName} (${first.doses}) prevista para esta fase.`, cta: 'Ver', sectionId: 'vaccines' });
  } else if (vaccineState.upcoming.length > 0) {
    const next = vaccineState.upcoming[0];
    priorityItems.push({ emoji: '💉', title: 'Vacina prevista em breve', body: `${next.shortName} (${next.doses}) — ${next.ageLabel}.`, cta: 'Ver', sectionId: 'vaccines' });
  }
  if (consultations.length === 0 && priorityItems.length < 2) {
    priorityItems.push({ emoji: '🩺', title: 'Nenhuma consulta registrada', body: 'Consultas regulares facilitam o acompanhamento.', cta: 'Registrar', sectionId: 'appointments' });
  }
  if (ageMonths >= 1 && growthHistory.length === 0 && priorityItems.length < 3) {
    priorityItems.push({ emoji: '📏', title: 'Registre peso e altura', body: `Acompanhar o crescimento de ${childName} facilita o histórico pediátrico.`, cta: 'Registrar', sectionId: 'growth' });
  }

  const activeMeds = medications.filter(m => m.active);
  const upcomingConsults = consultations.filter(c => c.date >= new Date().toISOString().split('T')[0]);
  const pastConsults = consultations.filter(c => c.date < new Date().toISOString().split('T')[0]);

  const inputStyle = {
    backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`,
    borderRadius: 12, color: TXT, fontFamily: 'Nunito, sans-serif',
    fontSize: 13, width: '100%', padding: '12px 16px', outline: 'none',
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: PAGE_BG }}>

      {/* HEADER */}
      <div className="px-5 pb-5 flex-shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          backgroundColor: MAUVE,
          borderRadius: '0 0 24px 24px',
        }}
      >
        <h1 className="text-[22px] font-bold font-quicksand" style={{ color: 'white' }}>Saúde</h1>
        <p className="text-[13px] mt-0.5 font-nunito" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {activeChild ? activeChild.name : 'Acompanhamento'}
          {ageCtx && <span style={{ opacity: 0.75 }}> · {ageCtx.phaseHint}</span>}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* HEALTH OVERVIEW */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito" style={{ color: TXT_MUTED }}>
            Visão geral
          </p>
          {dbLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <OverviewStat emoji="💉" label="Vacinas"
                value={vaccineState.due.length > 0 ? `${vaccineState.due.length}` : vaccineState.applied.length > 0 ? `${vaccineState.applied.length}` : '—'}
                sub={vaccineState.due.length > 0 ? `${vaccineState.due.length} a confirmar` : vaccineState.upcoming.length > 0 ? `${vaccineState.upcoming.length} próxima${vaccineState.upcoming.length > 1 ? 's' : ''}` : vaccineState.applied.length > 0 ? `${vaccineState.applied.length} confirmada${vaccineState.applied.length > 1 ? 's' : ''}` : 'Nenhuma confirmada ainda'}
                color={vaccineState.due.length > 0 ? AMBER : SAGE}
                urgent={vaccineState.due.length > 0}
                onTap={() => openAndScroll('vaccines')}
              />
              <OverviewStat emoji="🩺" label="Consultas"
                value={consultations.length > 0 ? `${consultations.length}` : '—'}
                sub={upcomingConsults.length > 0 ? `Próxima: ${new Date(upcomingConsults[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : consultations.length > 0 ? `${consultations.length} no histórico` : 'Nenhuma registrada'}
                color={upcomingConsults.length > 0 ? SAGE : MAUVE}
                urgent={false}
                onTap={() => openAndScroll('appointments')}
              />
              <OverviewStat emoji="🌡️" label="Sintomas"
                value={symptomHistory.length > 0 ? `${symptomHistory.length}` : '—'}
                sub={symptomHistory.length > 0 ? `Último: ${symptomHistory[0].date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : 'Nenhum registrado'}
                color={symptomHistory.length > 0 ? AMBER : SAGE}
                urgent={false}
                onTap={() => openAndScroll('symptoms')}
              />
              <OverviewStat emoji="📏" label="Crescimento"
                value={growthHistory.length > 0 && growthHistory[0].weight ? fmtWeight(growthHistory[0].weight) : growthHistory.length > 0 && growthHistory[0].height ? `${growthHistory[0].height}cm` : '—'}
                sub={growthHistory.length > 0 ? `${growthHistory[0].height ? `${growthHistory[0].height}cm · ` : ''}${growthHistory[0].date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : 'Nenhuma medição'}
                color={growthHistory.length > 0 ? SAGE : MAUVE}
                urgent={false}
                onTap={() => openAndScroll('growth')}
              />
            </div>
          )}
        </div>

        {/* ATTENTION */}
        {!dbLoading && priorityItems.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito" style={{ color: TXT_MUTED }}>
              Atenção
            </p>
            <div className="space-y-2">
              {priorityItems.slice(0, 3).map((item, i) => (
                <PriorityCard key={i} emoji={item.emoji} title={item.title} body={item.body}
                  ctaLabel={item.cta}
                  onCta={() => {
                    if (item.sectionId === 'appointments') { setOpenSection('appointments'); setShowConsultModal(true); }
                    else if (item.sectionId === 'growth') { setOpenSection('growth'); }
                    else { setOpenSection(item.sectionId); }
                    setTimeout(() => { document.getElementById(`section-${item.sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* VACINAS */}
        <div id="section-vaccines">
          <ExpandableSection id="vaccines" emoji="💉" title="Vacinas"
            statusPill={
              vaccineState.due.length > 0
                ? <InlineStatusPill label={`${vaccineState.due.length} a confirmar`} variant="paused" color={AMBER} />
                : vaccineState.applied.length > 0
                ? <InlineStatusPill label={`${vaccineState.applied.length} confirmada${vaccineState.applied.length > 1 ? 's' : ''}`} variant="active" color={SAGE} />
                : <InlineStatusPill label="Nenhuma confirmada" variant="paused" color={MAUVE} />
            }
            summary={`Calendário SUS · ${vaccineState.applied.length} confirmada${vaccineState.applied.length !== 1 ? 's' : ''}`}
            open={openSection === 'vaccines'} onToggle={() => toggle('vaccines')}
          >
            <div className="flex gap-4 rounded-xl p-3" style={{ backgroundColor: MUTED_BG }}>
              {[
                { value: vaccineState.applied.length, label: 'Confirmadas', color: SAGE },
                { value: vaccineState.due.length, label: 'A confirmar', color: AMBER },
                { value: vaccineState.upcoming.length, label: 'Próximas', color: MAUVE },
              ].map((stat, i) => (
                <div key={i} className="flex-1 text-center">
                  {i > 0 && <div className="w-px bg-border absolute" />}
                  <p className="text-[22px] font-bold font-quicksand" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide font-nunito mt-0.5" style={{ color: TXT_MUTED }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl px-3 py-2.5 flex items-start gap-2" style={{ backgroundColor: MUTED_BG }}>
              <span className="text-[13px] mt-0.5 flex-shrink-0">ℹ️</span>
              <p className="text-[11px] font-nunito leading-snug" style={{ color: TXT_MUTED }}>
                Nenhuma vacina é marcada automaticamente. Toque em <strong>Confirmar</strong> para registrar a data de aplicação.
              </p>
            </div>

            {vaccineState.applied.length > 0 && (
              <div>
                <SectionLabel>Confirmadas</SectionLabel>
                <div className="space-y-2">
                  {vaccineState.applied.map(v => <VaccineRow key={v.id} vaccine={v} state="applied" appliedDate={appliedVaccineDates[v.id]} />)}
                </div>
              </div>
            )}

            {vaccineState.due.length > 0 && (
              <div>
                <SectionLabel>Previstas para esta fase — confirmar quando aplicadas</SectionLabel>
                <div className="space-y-2">
                  {vaccineState.due.slice(0, showAllDue ? vaccineState.due.length : 5).map(v => <VaccineRow key={v.id} vaccine={v} state="due" onConfirm={setConfirmVaccine} />)}
                  {!showAllDue && vaccineState.due.length > 5 && (
                    <button onClick={() => setShowAllDue(true)}
                      className="text-[12px] font-semibold font-nunito ml-1" style={{ color: TXT_MUTED }}>
                      ▸ Ver todas ({vaccineState.due.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {vaccineState.upcoming.length > 0 && (
              <div>
                <SectionLabel>Próximas doses</SectionLabel>
                <div className="space-y-2">
                  {vaccineState.upcoming.map(v => <VaccineRow key={v.id} vaccine={v} state="upcoming" onConfirm={setConfirmVaccine} />)}
                </div>
              </div>
            )}

            {vaccineState.applied.length === 0 && vaccineState.due.length === 0 && vaccineState.upcoming.length === 0 && (
              <div className="rounded-xl px-3 py-3 flex items-center gap-2" style={{ backgroundColor: MUTED_BG }}>
                <span className="text-[13px] flex-shrink-0">📅</span>
                <p className="text-[11px] font-nunito leading-snug flex-1" style={{ color: TXT_MUTED }}>
                  As vacinas aparecerão aqui conforme {childName} for crescendo.
                </p>
              </div>
            )}

            {vaccineState.future.length > 0 && (
              <>
                <button onClick={() => setShowFuture(v => !v)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold font-nunito" style={{ color: TXT_MUTED }}>
                  <span>{showFuture ? '▾' : '▸'}</span>
                  Vacinas futuras ({vaccineState.future.length})
                </button>
                {showFuture && (
                  <div className="space-y-2">
                    {vaccineState.future.map(v => <VaccineRow key={v.id} vaccine={v} state="future" />)}
                  </div>
                )}
              </>
            )}

            <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: MAUVE_BG, border: `1px solid ${MAUVE_BORDER}` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>Vacinas complementares / opcionais</p>
                  <p className="text-[11px] font-nunito mt-0.5 leading-relaxed" style={{ color: TXT_MUTED }}>
                    Não fazem parte do calendário SUS. Disponíveis na rede particular.
                  </p>
                </div>
                <button onClick={() => setShowComplementary(v => !v)}
                  className="text-[11px] font-bold font-nunito flex-shrink-0" style={{ color: TXT_MUTED }}>
                  {showComplementary ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {showComplementary && (
                <div className="space-y-2 mt-1">
                  {COMPLEMENTARY_VACCINES.map(v => (
                    <div key={v.name} className="flex gap-2 py-2.5" style={{ borderTop: `1px solid ${MAUVE_BORDER}` }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-[12px] font-bold font-quicksand" style={{ color: TXT }}>{v.name}</p>
                          {v.requiresPediatricGuidance && (
                            <span className="text-[9px] font-bold font-nunito px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: MAUVE_BG, color: MAUVE, border: `1px solid ${MAUVE_BORDER}` }}>
                              Indicação pediátrica
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>{v.description}</p>
                        <p className="text-[10px] font-bold font-nunito mt-1" style={{ color: MAUVE }}>{v.ageHint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ExpandableSection>
        </div>

        {/* CONSULTAS */}
        <div id="section-appointments">
          <ExpandableSection id="appointments" emoji="🩺" title="Consultas"
            statusPill={upcomingConsults.length > 0 ? <InlineStatusPill label={`${upcomingConsults.length} próxima${upcomingConsults.length > 1 ? 's' : ''}`} variant="active" color={SAGE} /> : consultations.length > 0 ? <InlineStatusPill label={`${consultations.length} no histórico`} variant="active" color={SAGE} /> : <InlineStatusPill label="Nenhuma registrada" variant="paused" color={MAUVE} />}
            summary="Registre e acompanhe as consultas"
            open={openSection === 'appointments'} onToggle={() => toggle('appointments')}
          >
            <button onClick={() => setShowConsultModal(true)}
              className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
              style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
              Registrar consulta
            </button>

            {upcomingConsults.length > 0 && (
              <div>
                <SectionLabel>Próximas</SectionLabel>
                <div className="space-y-2">
                  {upcomingConsults.map(c => (
                    <div key={c.id} className="rounded-2xl px-4 py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                            {c.doctor || 'Consulta'}{c.specialty ? ` · ${c.specialty}` : ''}
                          </p>
                          {c.note && <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>{c.note}</p>}
                        </div>
                        <p className="text-[11px] font-bold font-nunito flex-shrink-0" style={{ color: SAGE }}>
                          {new Date(c.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastConsults.length > 0 && (
              <div>
                <SectionLabel>Histórico</SectionLabel>
                <div className="space-y-2">
                  {pastConsults.slice(0, 5).map(c => (
                    <div key={c.id} className="rounded-2xl px-4 py-3 opacity-70" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                            {c.doctor || 'Consulta'}{c.specialty ? ` · ${c.specialty}` : ''}
                          </p>
                          {c.note && <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>{c.note}</p>}
                        </div>
                        <p className="text-[11px] font-nunito flex-shrink-0" style={{ color: TXT_MUTED }}>
                          {new Date(c.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {consultations.length === 0 && (
              <div className="rounded-2xl px-5 py-8 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                <p className="text-3xl mb-2">🩺</p>
                <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>Nenhuma consulta registrada</p>
                <p className="text-[12px] mt-1.5 font-nunito leading-snug max-w-[220px] mx-auto" style={{ color: TXT_MUTED }}>
                  Registrar as consultas facilita o histórico e prepara melhor as conversas com o pediatra.
                </p>
              </div>
            )}
          </ExpandableSection>
        </div>

        {/* SINTOMAS */}
        <div id="section-symptoms">
          <ExpandableSection id="symptoms" emoji="🌡️" title="Sintomas"
            statusPill={loggedSymptoms.length > 0 ? <InlineStatusPill label={`${loggedSymptoms.length} selecionado${loggedSymptoms.length > 1 ? 's' : ''}`} variant="paused" color={AMBER} /> : symptomHistory.length > 0 ? <InlineStatusPill label={`${symptomHistory.length} no histórico`} variant="active" color={SAGE} /> : <InlineStatusPill label="Nenhum registrado" variant="active" color={SAGE} />}
            summary="Registre sintomas para facilitar a consulta"
            open={openSection === 'symptoms'} onToggle={() => toggle('symptoms')}
          >
            <div>
              <SectionLabel>Registrar sintoma</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_CHIPS.map(s => {
                  const isSelected = loggedSymptoms.includes(s.label);
                  return (
                    <button key={s.label}
                      onClick={() => setLoggedSymptoms(prev => isSelected ? prev.filter(l => l !== s.label) : [...prev, s.label])}
                      className="py-2 px-3.5 rounded-2xl text-[12px] font-bold font-nunito transition-all active:scale-95"
                      style={{
                        backgroundColor: isSelected ? AMBER_BG : MUTED_BG,
                        color: isSelected ? AMBER : TXT,
                        border: `1.5px solid ${isSelected ? AMBER_BORDER : 'transparent'}`,
                        cursor: 'pointer',
                      }}>
                      {s.emoji} {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loggedSymptoms.length > 0 && (
              <div className="space-y-2.5">
                <textarea value={symptomNote} onChange={e => setSymptomNote(e.target.value)}
                  placeholder="Observações adicionais (opcional)..." rows={2}
                  style={{ ...inputStyle, resize: 'none' }}
                />
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {loggedSymptoms.map(s => (
                    <span key={s} className="text-[11px] font-bold font-nunito px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: AMBER_BG, color: AMBER }}>
                      {s}
                    </span>
                  ))}
                </div>
                <button onClick={saveSymptoms} disabled={symptomSaving}
                  className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
                  {symptomSaving ? 'Salvando…' : 'Salvar sintomas'}
                </button>
              </div>
            )}

            <div>
              <SectionLabel>Histórico</SectionLabel>
              {symptomHistory.length === 0 ? (
                <div className="rounded-2xl px-5 py-8 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                  <p className="text-3xl mb-2">🌡️</p>
                  <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>Nenhum sintoma registrado</p>
                  <p className="text-[12px] mt-1 font-nunito leading-snug max-w-[200px] mx-auto" style={{ color: TXT_MUTED }}>
                    Registrar sintomas cria um histórico útil para as conversas com o pediatra.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {symptomHistory.slice(0, 5).map(entry => (
                    <div key={entry.id} className="rounded-2xl px-4 py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {entry.symptoms.map(s => (
                          <span key={s} className="text-[11px] font-bold font-nunito px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: AMBER_BG, color: AMBER }}>
                            {s}
                          </span>
                        ))}
                      </div>
                      {entry.note && <p className="text-[12px] font-nunito leading-snug mb-1" style={{ color: TXT }}>{entry.note}</p>}
                      <p className="text-[10px] font-nunito" style={{ color: TXT_MUTED }}>
                        {entry.date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ExpandableSection>
        </div>

        {/* MEDICAMENTOS */}
        <ExpandableSection id="medications" emoji="💊" title="Medicamentos"
          statusPill={activeMeds.length > 0 ? <InlineStatusPill label={`${activeMeds.length} ativo${activeMeds.length > 1 ? 's' : ''}`} variant="paused" color={AMBER} /> : medications.length > 0 ? <InlineStatusPill label={`${medications.length} no histórico`} variant="active" color={SAGE} /> : <InlineStatusPill label="Nenhum ativo" variant="active" color={SAGE} />}
          summary="Medicamentos em uso e histórico"
          open={openSection === 'medications'} onToggle={() => toggle('medications')}
        >
          <button onClick={() => setShowMedModal(true)}
            className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
            style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
            Adicionar medicamento
          </button>

          {activeMeds.length > 0 && (
            <div>
              <SectionLabel>Em uso</SectionLabel>
              <div className="space-y-2">
                {activeMeds.map(m => (
                  <div key={m.id} className="rounded-2xl px-4 py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>{m.name}</p>
                        {(m.dosage || m.frequency) && <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>{[m.dosage, m.frequency].filter(Boolean).join(' · ')}</p>}
                        {m.note && <p className="text-[11px] font-nunito mt-0.5 italic" style={{ color: TXT_MUTED }}>{m.note}</p>}
                      </div>
                      <InlineStatusPill label="Ativo" variant="active" color={SAGE} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {medications.filter(m => !m.active).length > 0 && (
            <div>
              <SectionLabel>Histórico</SectionLabel>
              <div className="space-y-2">
                {medications.filter(m => !m.active).slice(0, 3).map(m => (
                  <div key={m.id} className="rounded-2xl px-4 py-3 opacity-60" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>{m.name}</p>
                    {(m.dosage || m.frequency) && <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>{[m.dosage, m.frequency].filter(Boolean).join(' · ')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {medications.length === 0 && (
            <div className="rounded-2xl px-5 py-8 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <p className="text-3xl mb-2">💊</p>
              <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>Nenhum medicamento ativo</p>
              <p className="text-[12px] mt-1.5 font-nunito leading-snug max-w-[200px] mx-auto" style={{ color: TXT_MUTED }}>
                Registre medicamentos em uso para acompanhar horários e posologias.
              </p>
            </div>
          )}
        </ExpandableSection>

        {/* CRESCIMENTO */}
        <div id="section-growth">
          <ExpandableSection id="growth" emoji="📏" title="Crescimento"
            statusPill={growthHistory.length > 0 ? <InlineStatusPill label={growthHistory[0].weight ? fmtWeight(growthHistory[0].weight) : `${growthHistory.length} medição${growthHistory.length > 1 ? 'ões' : ''}`} variant="active" color={SAGE} /> : <InlineStatusPill label="Sem medições" variant="paused" color={MAUVE} />}
            summary={growthHistory.length > 0 ? `Última medição em ${growthHistory[0].date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : `Registre peso e altura de ${childName}`}
            open={openSection === 'growth'} onToggle={() => toggle('growth')}
          >
            {growthHistory.length > 0 && (() => {
              const latest = growthHistory[0], prev = growthHistory[1];
              const deltaW = latest.weight && prev?.weight ? +(latest.weight - prev.weight).toFixed(2) : null;
              const deltaH = latest.height && prev?.height ? +(latest.height - prev.height).toFixed(1) : null;
              return (
                <div className="rounded-2xl px-4 py-4 space-y-3"
                  style={{ backgroundColor: SAGE_LIGHT, border: `1px solid ${SAGE_BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] font-nunito" style={{ color: TXT_MUTED }}>
                    Última medição · {latest.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </p>
                  <div className="flex items-end gap-5 flex-wrap">
                    {latest.weight != null && (
                      <div>
                        <p className="text-[28px] font-bold font-quicksand leading-none" style={{ color: SAGE }}>{fmtWeight(latest.weight)}</p>
                        {deltaW != null && <p className="text-[11px] font-semibold font-nunito mt-1" style={{ color: deltaW >= 0 ? SAGE : AMBER }}>{deltaW >= 0 ? '▲' : '▼'} {fmtWeightDelta(deltaW, latest.weight >= 1000)} vs anterior</p>}
                      </div>
                    )}
                    {latest.weight != null && latest.height != null && <div className="w-px h-10 self-center" style={{ backgroundColor: CARD_BORDER }} />}
                    {latest.height != null && (
                      <div>
                        <p className="text-[28px] font-bold font-quicksand leading-none" style={{ color: MAUVE }}>{latest.height}<span className="text-[14px] font-semibold ml-0.5">cm</span></p>
                        {deltaH != null && <p className="text-[11px] font-semibold font-nunito mt-1" style={{ color: deltaH >= 0 ? SAGE : AMBER }}>{deltaH >= 0 ? '▲' : '▼'} {Math.abs(deltaH)} cm vs anterior</p>}
                      </div>
                    )}
                  </div>
                  {latest.note && <p className="text-[11px] font-nunito italic leading-snug" style={{ color: TXT_MUTED }}>{latest.note}</p>}
                </div>
              );
            })()}

            {growthHistory.filter(e => e.weight != null).length >= 2 && (() => {
              const chartData = [...growthHistory].filter(e => e.weight != null).reverse().map(e => ({ date: e.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), peso: e.weight }));
              return (
                <div>
                  <SectionLabel>Evolução do peso (kg)</SectionLabel>
                  <div className="rounded-2xl pt-3 pb-2 pr-2" style={{ backgroundColor: MUTED_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CARD_BORDER} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'Nunito', fill: TXT_MUTED }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fontFamily: 'Nunito', fill: TXT_MUTED }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'Nunito', backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12 }} formatter={(v: number) => [`${v} kg`, 'Peso']} />
                        <Line type="monotone" dataKey="peso" stroke={SAGE} strokeWidth={2.5} dot={<Dot r={4} fill={SAGE} stroke={CARD_BG} strokeWidth={2} />} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}

            {growthHistory.filter(e => e.height != null).length >= 2 && (() => {
              const chartData = [...growthHistory].filter(e => e.height != null).reverse().map(e => ({ date: e.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), altura: e.height }));
              return (
                <div>
                  <SectionLabel>Evolução da altura (cm)</SectionLabel>
                  <div className="rounded-2xl pt-3 pb-2 pr-2" style={{ backgroundColor: MUTED_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CARD_BORDER} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'Nunito', fill: TXT_MUTED }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fontFamily: 'Nunito', fill: TXT_MUTED }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'Nunito', backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12 }} formatter={(v: number) => [`${v} cm`, 'Altura']} />
                        <Line type="monotone" dataKey="altura" stroke={MAUVE} strokeWidth={2.5} dot={<Dot r={4} fill={MAUVE} stroke={CARD_BG} strokeWidth={2} />} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}

            <div>
              <SectionLabel>Registrar medição</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold font-nunito uppercase tracking-wide mb-1.5" style={{ color: TXT_MUTED }}>Peso (kg)</p>
                  <input type="number" step="0.01" placeholder="Ex: 5.2" value={growthForm.weight ?? ''}
                    onChange={e => setGrowthForm(f => ({ ...f, weight: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <p className="text-[11px] font-bold font-nunito uppercase tracking-wide mb-1.5" style={{ color: TXT_MUTED }}>Altura (cm)</p>
                  <input type="number" step="0.1" placeholder="Ex: 58.5" value={growthForm.height ?? ''}
                    onChange={e => setGrowthForm(f => ({ ...f, height: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <input type="text" placeholder="Observação (opcional)" value={growthForm.note ?? ''}
                onChange={e => setGrowthForm(f => ({ ...f, note: e.target.value }))}
                style={{ ...inputStyle, marginTop: 12 }} />
              <button onClick={saveGrowthMeasurement} disabled={growthSaving || (!growthForm.weight && !growthForm.height)}
                className="mt-3 w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
                {growthSaving ? 'Salvando…' : 'Salvar medição'}
              </button>
            </div>

            {growthHistory.length > 0 && (
              <div>
                <SectionLabel>Histórico completo</SectionLabel>
                <div className="space-y-2">
                  {growthHistory.map((entry, idx) => {
                    const prevEntry = growthHistory[idx + 1];
                    const deltaW = entry.weight != null && prevEntry?.weight != null ? +(entry.weight - prevEntry.weight).toFixed(2) : null;
                    const deltaH = entry.height != null && prevEntry?.height != null ? +(entry.height - prevEntry.height).toFixed(1) : null;
                    return (
                      <div key={entry.id} className="rounded-2xl px-4 py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              {entry.weight != null && (
                                <span className="text-[15px] font-bold font-quicksand" style={{ color: SAGE }}>
                                  {fmtWeight(entry.weight)}
                                  {deltaW != null && <span className="text-[10px] font-semibold ml-1" style={{ color: deltaW >= 0 ? SAGE : AMBER }}>{deltaW >= 0 ? '▲' : '▼'}{fmtWeightDelta(deltaW, entry.weight >= 1000)}</span>}
                                </span>
                              )}
                              {entry.height != null && (
                                <span className="text-[15px] font-bold font-quicksand" style={{ color: MAUVE }}>
                                  {entry.height} cm
                                  {deltaH != null && <span className="text-[10px] font-semibold ml-1" style={{ color: deltaH >= 0 ? MAUVE : AMBER }}>{deltaH >= 0 ? '▲' : '▼'}{Math.abs(deltaH)}</span>}
                                </span>
                              )}
                            </div>
                            {entry.note && <p className="text-[11px] font-nunito mt-1 italic" style={{ color: TXT_MUTED }}>{entry.note}</p>}
                          </div>
                          <p className="text-[10px] font-nunito flex-shrink-0" style={{ color: TXT_MUTED }}>
                            {entry.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {growthHistory.length === 0 && (
              <div className="rounded-2xl px-5 py-8 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                <p className="text-3xl mb-2">📏</p>
                <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>Nenhuma medição registrada</p>
                <p className="text-[12px] mt-1 font-nunito leading-snug max-w-[220px] mx-auto" style={{ color: TXT_MUTED }}>
                  Registre peso e altura para iniciar o histórico de crescimento de {childName}.
                </p>
              </div>
            )}
          </ExpandableSection>
        </div>

        {/* RELATÓRIO MÉDICO */}
        <ExpandableSection id="report" emoji="📋" title="Relatório médico"
          statusPill={savedNotes.length > 0 ? <InlineStatusPill label={`${savedNotes.length} nota${savedNotes.length > 1 ? 's' : ''}`} variant="active" color={SAGE} /> : <InlineStatusPill label="Vazio" variant="paused" color={MAUVE} />}
          summary="Notas e eventos para compartilhar com o pediatra"
          open={openSection === 'report'} onToggle={() => toggle('report')}
        >
          <div>
            <SectionLabel>Adicionar nota livre</SectionLabel>
            <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)}
              placeholder="Ex: mamou menos hoje, irritado após vacina..."
              rows={3} style={{ ...inputStyle, resize: 'none' }}
            />
            <button onClick={saveQuickNote} disabled={savingNote || !quickNote.trim()}
              className="mt-2 w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
              {savingNote ? 'Salvando…' : 'Salvar nota'}
            </button>
            {noteSavedFeedback && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: SAGE_BG }}>
                <span className="text-[13px]">✓</span>
                <p className="text-[12px] font-semibold font-nunito" style={{ color: SAGE }}>Nota salva com data e hora</p>
              </div>
            )}
          </div>

          {savedNotes.length > 0 && (
            <div>
              <SectionLabel>Notas salvas</SectionLabel>
              <div className="space-y-2">
                {savedNotes.map((n, i) => (
                  <div key={i} className="rounded-2xl px-4 py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <p className="text-[12px] font-nunito leading-snug" style={{ color: TXT }}>{n.text}</p>
                    <p className="text-[10px] font-nunito mt-1.5" style={{ color: TXT_MUTED }}>
                      {n.date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {symptomHistory.length > 0 && (
            <div>
              <SectionLabel>Sintomas registrados</SectionLabel>
              <div className="space-y-1.5">
                {symptomHistory.slice(0, 3).map(entry => (
                  <div key={entry.id} className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                      {entry.symptoms.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] font-bold font-nunito" style={{ color: AMBER }}>{s}</span>
                      ))}
                      {entry.symptoms.length > 3 && <span className="text-[10px] font-nunito" style={{ color: TXT_MUTED }}>+{entry.symptoms.length - 3}</span>}
                    </div>
                    <p className="text-[10px] font-nunito flex-shrink-0" style={{ color: TXT_MUTED }}>
                      {entry.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: MUTED_BG }}>
            <p className="text-[12px] font-bold font-nunito" style={{ color: TXT }}>O que vale incluir</p>
            {['🤱 Mamadas com dificuldade ou comportamento diferente', '💩 Fraldas com cor ou consistência incomum', '🌡️ Febre ou sintomas que persistem', '💊 Medicamentos e possíveis reações', '😴 Sono muito longo ou muitos despertares', '📏 Medições de peso e altura recentes'].map(item => (
              <p key={item} className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>{item}</p>
            ))}
          </div>
        </ExpandableSection>

      </div>

      <AnimatePresence>
        {confirmVaccine && activeChild && user && (
          <VaccineConfirmModal vaccine={confirmVaccine} childId={activeChild.id} userId={user.id}
            onClose={() => setConfirmVaccine(null)}
            onConfirmed={(vaccineId, date) => { setAppliedVaccineIds(prev => new Set([...prev, vaccineId])); setAppliedVaccineDates(prev => ({ ...prev, [vaccineId]: date })); setConfirmVaccine(null); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showConsultModal && activeChild && user && (
          <ConsultationModal childId={activeChild.id} userId={user.id}
            onClose={() => setShowConsultModal(false)}
            onSaved={entry => setConsultations(prev => [entry, ...prev])}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMedModal && activeChild && user && (
          <MedicationModal childId={activeChild.id} userId={user.id}
            onClose={() => setShowMedModal(false)}
            onSaved={entry => setMedications(prev => [entry, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
