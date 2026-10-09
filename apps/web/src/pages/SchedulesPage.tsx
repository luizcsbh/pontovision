import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import {
  Clock, CheckCircle2, ShieldCheck, Plus, AlertTriangle,
  Copy, RotateCcw, Info, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Tipos / constantes
// ─────────────────────────────────────────────
const DAY_NAMES = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DayRule {
  dayOfWeek: number;
  isEnabled: boolean;
  plannedEntry: string;
  plannedBreakStart: string;
  plannedBreakEnd: string;
  plannedExit: string;
  expectedWorkMinutes: number; // calculado automaticamente
}

interface Schedule {
  _id?: string;
  name: string;
  weeklyRules: DayRule[];
  effectiveFrom: string;
  toleranceMinutes: number;
  isDefault: boolean;
}

// ─────────────────────────────────────────────
// Helpers de cálculo
// ─────────────────────────────────────────────
function timeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHHMM(minutes: number): string {
  if (minutes <= 0) return '00:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Calcula minutos trabalhados: (saída - entrada) - pausa */
function calcWorkMinutes(rule: DayRule): number {
  const entry = timeToMinutes(rule.plannedEntry);
  const exit  = timeToMinutes(rule.plannedExit);
  const bStart = timeToMinutes(rule.plannedBreakStart);
  const bEnd   = timeToMinutes(rule.plannedBreakEnd);

  if (!entry || !exit || exit <= entry) return 0;
  const total = exit - entry;
  const breakMin = bEnd > bStart ? bEnd - bStart : 0;
  return Math.max(0, total - breakMin);
}

/** Formata minutos como "8h00" ou "8h30" */
function fmtHours(mins: number): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function totalWeekMinutes(rules: DayRule[]): number {
  return rules.filter((r) => r.isEnabled).reduce((acc, r) => acc + r.expectedWorkMinutes, 0);
}

/** Escala padrão inicial (Seg–Sex 08:00–17:00, 1h almoço) */
function defaultWeeklyRules(): DayRule[] {
  return Array.from({ length: 7 }, (_, i) => {
    const workday = i >= 1 && i <= 5;
    return {
      dayOfWeek: i,
      isEnabled: workday,
      plannedEntry: workday ? '08:00' : '',
      plannedBreakStart: workday ? '12:00' : '',
      plannedBreakEnd: workday ? '13:00' : '',
      plannedExit: workday ? '17:00' : '',
      expectedWorkMinutes: workday ? 480 : 0,
    };
  });
}

function emptySchedule(): Schedule {
  return {
    name: 'Minha Jornada',
    weeklyRules: defaultWeeklyRules(),
    effectiveFrom: new Date().toISOString().slice(0, 10),
    toleranceMinutes: 10,
    isDefault: true,
  };
}

// ─────────────────────────────────────────────
// Componente: linha de um dia
// ─────────────────────────────────────────────
interface DayRowProps {
  rule: DayRule;
  onChange: (updated: DayRule) => void;
}

const DayRow: React.FC<DayRowProps> = ({ rule, onChange }) => {
  const [open, setOpen] = useState(false);
  const workMins = rule.isEnabled ? calcWorkMinutes(rule) : 0;
  const breakMins = rule.isEnabled
    ? Math.max(0, timeToMinutes(rule.plannedBreakEnd) - timeToMinutes(rule.plannedBreakStart))
    : 0;

  const set = (field: keyof DayRule, value: string | boolean) => {
    const updated = { ...rule, [field]: value };
    // Recalcula minutos sempre que um campo de horário muda
    updated.expectedWorkMinutes = calcWorkMinutes(updated as DayRule);
    onChange(updated as DayRule);
  };

  const isIncomplete =
    rule.isEnabled &&
    (!rule.plannedEntry || !rule.plannedExit);

  const isInvalid =
    rule.isEnabled &&
    rule.plannedEntry &&
    rule.plannedExit &&
    timeToMinutes(rule.plannedExit) <= timeToMinutes(rule.plannedEntry);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        !rule.isEnabled
          ? 'border-dashed border-slate-200 bg-slate-50/50 opacity-60'
          : isInvalid
          ? 'border-red-200 bg-red-50/30'
          : 'border-slate-200 bg-white'
      }`}
    >
      {/* Linha resumo (sempre visível) */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Toggle dia */}
        <input
          type="checkbox"
          checked={rule.isEnabled}
          onChange={(e) => {
            const enabled = e.target.checked;
            onChange({
              ...rule,
              isEnabled: enabled,
              plannedEntry:      enabled ? '08:00' : '',
              plannedBreakStart: enabled ? '12:00' : '',
              plannedBreakEnd:   enabled ? '13:00' : '',
              plannedExit:       enabled ? '17:00' : '',
              expectedWorkMinutes: enabled ? 480 : 0,
            });
            if (enabled) setOpen(true);
          }}
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
        />

        {/* Nome do dia */}
        <span className="w-28 font-semibold text-sm text-slate-800 shrink-0">
          {DAY_NAMES[rule.dayOfWeek]}
        </span>

        {rule.isEnabled ? (
          <>
            {/* Horários resumidos */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-1 flex-wrap">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                {rule.plannedEntry || '--:--'}
              </span>
              <span className="text-slate-400">→</span>
              {rule.plannedBreakStart && (
                <>
                  <span className="font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">
                    {rule.plannedBreakStart}
                  </span>
                  <span className="text-slate-400">almoço</span>
                  <span className="font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">
                    {rule.plannedBreakEnd}
                  </span>
                  <span className="text-slate-400">→</span>
                </>
              )}
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                {rule.plannedExit || '--:--'}
              </span>
            </div>

            {/* Total calculado */}
            <div className="shrink-0 text-right ml-auto">
              {isInvalid ? (
                <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Inválido
                </span>
              ) : (
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-700">{fmtHours(workMins)}</span>
                  {breakMins > 0 && (
                    <span className="text-xs text-slate-400 block">
                      {fmtHours(breakMins)} pausa
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Expandir */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Folga / Dia não trabalhado</span>
        )}
      </div>

      {/* Detalhe (expansível) */}
      {rule.isEnabled && open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            {/* Entrada */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                🟢 Entrada
              </label>
              <input
                type="time"
                value={rule.plannedEntry}
                onChange={(e) => set('plannedEntry', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Início intervalo */}
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">
                🍽️ Início Almoço
              </label>
              <input
                type="time"
                value={rule.plannedBreakStart}
                onChange={(e) => set('plannedBreakStart', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none bg-amber-50/40"
              />
            </div>

            {/* Fim intervalo */}
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">
                🍽️ Fim Almoço
              </label>
              <input
                type="time"
                value={rule.plannedBreakEnd}
                onChange={(e) => set('plannedBreakEnd', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none bg-amber-50/40"
              />
            </div>

            {/* Saída */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                🔴 Saída
              </label>
              <input
                type="time"
                value={rule.plannedExit}
                onChange={(e) => set('plannedExit', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cálculo detalhado */}
          {workMins > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 flex flex-wrap gap-4">
              <span>
                ⏱️ Jornada total: <strong>{fmtHours(timeToMinutes(rule.plannedExit) - timeToMinutes(rule.plannedEntry))}</strong>
              </span>
              {breakMins > 0 && (
                <span>
                  🍽️ Pausa: <strong>{fmtHours(breakMins)}</strong>
                </span>
              )}
              <span>
                ✅ Horas trabalhadas: <strong>{fmtHours(workMins)}</strong> ({workMins} min)
              </span>
            </div>
          )}

          {isIncomplete && (
            <p className="mt-2 text-xs text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Informe pelo menos hora de entrada e saída.
            </p>
          )}

          {isInvalid && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Hora de saída deve ser posterior à entrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────
export const SchedulesPage: React.FC = () => {
  const [schedule, setSchedule] = useState<Schedule>(emptySchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Carrega escala padrão ──
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/schedules/default');
        if (data) {
          // Garante que cada regra tem todos os campos
          const rules: DayRule[] = Array.from({ length: 7 }, (_, i) => {
            const found = data.weeklyRules?.find((r: any) => r.dayOfWeek === i);
            if (found) {
              return {
                ...found,
                expectedWorkMinutes: calcWorkMinutes(found),
              };
            }
            return {
              dayOfWeek: i,
              isEnabled: false,
              plannedEntry: '',
              plannedBreakStart: '',
              plannedBreakEnd: '',
              plannedExit: '',
              expectedWorkMinutes: 0,
            };
          });
          setSchedule({ ...data, weeklyRules: rules });
        }
      } catch {
        // sem escala ainda — usa o default vazio
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Atualiza um dia ──
  const handleDayChange = useCallback((idx: number, updated: DayRule) => {
    setSchedule((prev) => {
      const rules = [...prev.weeklyRules];
      rules[idx] = updated;
      return { ...prev, weeklyRules: rules };
    });
  }, []);

  // ── Replica horário de Seg para todos os dias úteis ──
  const replicateMonday = () => {
    const mon = schedule.weeklyRules[1];
    if (!mon.isEnabled) return;
    setSchedule((prev) => ({
      ...prev,
      weeklyRules: prev.weeklyRules.map((r, i) => {
        if (i >= 1 && i <= 5) {
          const updated = {
            ...r,
            isEnabled: true,
            plannedEntry: mon.plannedEntry,
            plannedBreakStart: mon.plannedBreakStart,
            plannedBreakEnd: mon.plannedBreakEnd,
            plannedExit: mon.plannedExit,
          };
          return { ...updated, expectedWorkMinutes: calcWorkMinutes(updated) };
        }
        return r;
      }),
    }));
  };

  // ── Reset para padrão 8h ──
  const resetDefault = () => {
    setSchedule((prev) => ({ ...prev, weeklyRules: defaultWeeklyRules() }));
  };

  // ── Salvar ──
  const handleSave = async () => {
    setErrorMsg('');
    try {
      setSaving(true);
      const payload = {
        ...schedule,
        weeklyRules: schedule.weeklyRules.map((r) => ({
          ...r,
          expectedWorkMinutes: calcWorkMinutes(r),
        })),
      };
      if (schedule._id) {
        await apiRequest(`/schedules/${schedule._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiRequest('/schedules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSchedule((prev) => ({ ...prev, _id: created._id }));
      }
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3500);
    } catch (err: any) {
      setErrorMsg('Falha ao salvar jornada. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Totais ──
  const weekTotal = totalWeekMinutes(schedule.weeklyRules);
  const workDaysCount = schedule.weeklyRules.filter((r) => r.isEnabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Jornada de Trabalho</h1>
          <p className="text-sm text-slate-500">
            Configure entrada, saída e almoço — as horas são calculadas automaticamente.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Jornada'}
        </button>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Jornada atualizada com sucesso!
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-sm font-semibold">
          <AlertTriangle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* ── Card de configurações gerais ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
          Configurações Gerais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Jornada
            </label>
            <input
              type="text"
              value={schedule.name}
              onChange={(e) => setSchedule((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Contrato CLT 8h"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Vigência */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vigência a partir de
            </label>
            <input
              type="date"
              value={schedule.effectiveFrom}
              onChange={(e) => setSchedule((p) => ({ ...p, effectiveFrom: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Tolerância */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              Tolerância CLT (min)
              <span title="Art. 58 §1º — variações de até 5 min não são computadas. O padrão é 10 min.">
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={schedule.toleranceMinutes}
              onChange={(e) =>
                setSchedule((p) => ({ ...p, toleranceMinutes: parseInt(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Escala semanal ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
              Escala Semanal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure entrada, almoço e saída para cada dia.
            </p>
          </div>

          {/* Ações rápidas */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={replicateMonday}
              title="Copia o horário de segunda para todos os dias úteis"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Replicar Seg → Seg–Sex
            </button>
            <button
              type="button"
              onClick={resetDefault}
              title="Reseta para padrão 08:00–17:00 com 1h de almoço"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Padrão 8h
            </button>
          </div>
        </div>

        {/* Legenda mini */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 pb-1 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
            Horários de trabalho
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-100 inline-block" />
            Intervalo de almoço
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-100 inline-block" />
            Total calculado automaticamente
          </span>
        </div>

        {/* Linhas dos dias */}
        <div className="space-y-2">
          {schedule.weeklyRules.map((rule, idx) => (
            <DayRow
              key={rule.dayOfWeek}
              rule={rule}
              onChange={(updated) => handleDayChange(idx, updated)}
            />
          ))}
        </div>
      </div>

      {/* ── Resumo semanal ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold opacity-80">Resumo da Semana</p>
            <p className="text-3xl font-black mt-1">{fmtHours(weekTotal)}</p>
            <p className="text-xs opacity-70 mt-0.5">
              {workDaysCount} dia{workDaysCount !== 1 ? 's' : ''} de trabalho ·{' '}
              {fmtHours(Math.round(weekTotal / (workDaysCount || 1)))} média/dia
            </p>
          </div>

          {/* Mini calendário visual */}
          <div className="flex gap-1.5">
            {schedule.weeklyRules.map((r) => (
              <div key={r.dayOfWeek} className="flex flex-col items-center gap-1">
                <span className="text-[10px] opacity-60 font-medium">{DAY_SHORT[r.dayOfWeek]}</span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    r.isEnabled
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'bg-white/10 text-white/40'
                  }`}
                  title={r.isEnabled ? `${fmtHours(r.expectedWorkMinutes)}` : 'Folga'}
                >
                  {r.isEnabled ? fmtHours(r.expectedWorkMinutes).replace('h', 'h') : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aviso CLT */}
        {weekTotal > 0 && weekTotal !== 2400 && (
          <div className="mt-4 flex items-start gap-2 text-xs opacity-80 bg-white/10 rounded-xl p-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Jornada CLT padrão: <strong>44h semanais</strong> (2.640 min).
              Sua jornada configurada: <strong>{fmtHours(weekTotal)}</strong>.
              {weekTotal > 2640 && ' ⚠️ Acima do limite CLT — verifique com seu RH.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
