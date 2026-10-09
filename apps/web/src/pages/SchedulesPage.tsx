import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export const SchedulesPage: React.FC = () => {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/schedules/default');
        setSchedule(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const handleRuleToggle = (dayIndex: number) => {
    if (!schedule) return;
    const rules = [...schedule.weeklyRules];
    rules[dayIndex] = {
      ...rules[dayIndex],
      isEnabled: !rules[dayIndex].isEnabled,
      expectedWorkMinutes: !rules[dayIndex].isEnabled ? 480 : 0,
    };
    setSchedule({ ...schedule, weeklyRules: rules });
  };

  const handleMinutesChange = (dayIndex: number, minutes: number) => {
    if (!schedule) return;
    const rules = [...schedule.weeklyRules];
    rules[dayIndex] = {
      ...rules[dayIndex],
      expectedWorkMinutes: minutes,
    };
    setSchedule({ ...schedule, weeklyRules: rules });
  };

  const handleSave = async () => {
    if (!schedule) return;
    try {
      setSaving(true);
      await apiRequest(`/schedules/${schedule._id}`, {
        method: 'PUT',
        body: JSON.stringify(schedule),
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Falha ao salvar jornada.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Jornadas de Trabalho</h1>
          <p className="text-sm text-slate-500">Configure seus horários contratuais e tolerâncias de apuração CLT.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Configurações de jornada atualizadas com sucesso!</span>
        </div>
      )}

      {schedule && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Jornada</label>
              <input
                type="text"
                value={schedule.name}
                onChange={(e) => setSchedule({ ...schedule, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tolerância CLT (minutos) — Art. 58 § 1º
              </label>
              <input
                type="number"
                value={schedule.toleranceMinutes}
                onChange={(e) => setSchedule({ ...schedule, toleranceMinutes: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">Escala Semanal de Trabalho</h3>

            <div className="space-y-2">
              {schedule.weeklyRules?.map((rule: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                    rule.isEnabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/40 border-dashed border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={rule.isEnabled}
                      onChange={() => handleRuleToggle(idx)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-semibold text-sm text-slate-800">{DAY_NAMES[idx]}</span>
                  </div>

                  {rule.isEnabled ? (
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-500">Horas diárias:</span>
                      <select
                        value={rule.expectedWorkMinutes}
                        onChange={(e) => handleMinutesChange(idx, parseInt(e.target.value, 10))}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={240}>4 horas (240 min)</option>
                        <option value={360}>6 horas (360 min)</option>
                        <option value={480}>8 horas (480 min)</option>
                        <option value={528}>8h48min (528 min - compensado)</option>
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Folga / Dia Não Trabalhado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
