import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { minutesToTimeString, TimeEntryType, TimeEntrySource } from '@pontovision/shared';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [monthData, setMonthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const fetchMonth = async (ym: string) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/calendar/month?month=${ym}`);
      setMonthData(data);
      if (selectedDay) {
        const found = data.days.find((d: any) => d.date === selectedDay.date);
        setSelectedDay(found || data.days[0]);
      } else {
        setSelectedDay(data.days[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonth(currentYearMonth);
  }, [currentYearMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentYearMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setCurrentYearMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = currentYearMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setCurrentYearMonth(nextDate.toISOString().slice(0, 7));
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Deseja realmente remover esta marcação?')) return;
    try {
      await apiRequest(`/entries/${entryId}`, { method: 'DELETE' });
      fetchMonth(currentYearMonth);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !monthData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Calendário de Ponto</h1>
          <p className="text-sm text-slate-500">Visualização interativa dia a dia com cálculo CLT e detecção de faltas.</p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-800 px-4 text-sm font-mono">
            {currentYearMonth}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Month Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading days for offset */}
            {monthData?.days?.[0] &&
              Array.from({ length: monthData.days[0].dayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[85px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 opacity-30" />
              ))}

            {monthData?.days?.map((day: any) => {
              const isSelected = selectedDay?.date === day.date;
              const hasPunches = day.calculation.entries.length > 0;
              const workedMin = day.calculation.totalWorkedMinutes;
              const balanceMin = day.calculation.balanceMinutes;

              return (
                <div
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[85px] p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm'
                      : day.isHoliday
                      ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                      : day.calculation.isIncomplete
                      ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {parseInt(day.date.slice(8), 10)}
                    </span>
                    {day.isHoliday && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title={`Feriado: ${day.holidayName}`} />
                    )}
                    {day.calculation.isIncomplete && (
                      <span title="Marcação incompleta">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      </span>
                    )}
                  </div>

                  {hasPunches ? (
                    <div className="mt-1">
                      <div className="text-[11px] font-mono font-bold text-slate-800">
                        {minutesToTimeString(workedMin)}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          balanceMin > 0
                            ? 'text-emerald-600'
                            : balanceMin < 0
                            ? 'text-red-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {balanceMin !== 0 ? minutesToTimeString(balanceMin, true) : '00:00'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300">
                      {day.isHoliday ? 'Feriado' : '-'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          {selectedDay ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-blue-600 uppercase">Detalhes do Dia</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">
                  {selectedDay.date}
                </h3>
                {selectedDay.isHoliday && (
                  <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 font-medium rounded-full">
                    🎉 Feriado: {selectedDay.holidayName}
                  </span>
                )}
              </div>

              {/* Day stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Trabalhado</span>
                  <span className="text-base font-bold text-slate-800 font-mono">
                    {minutesToTimeString(selectedDay.calculation.totalWorkedMinutes)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Saldo</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      selectedDay.calculation.balanceMinutes >= 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {minutesToTimeString(selectedDay.calculation.balanceMinutes, true)}
                  </span>
                </div>
              </div>

              {selectedDay.calculation.warnings?.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Inconsistência detectada:</span>
                  </div>
                  {selectedDay.calculation.warnings.map((w: string, i: number) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}

              {/* Punches List */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Marcações Registradas</h4>
                {selectedDay.calculation.entries.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                    Nenhuma marcação gravada neste dia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDay.calculation.entries.map((entry: any) => (
                      <div
                        key={entry._id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-white border border-slate-200 rounded-lg">
                            {entry.time}
                          </span>
                          <span className="text-slate-600">
                            {entry.type === TimeEntryType.ENTRY && 'Entrada'}
                            {entry.type === TimeEntryType.INTERVAL_START && 'Intervalo (Saída)'}
                            {entry.type === TimeEntryType.INTERVAL_END && 'Intervalo (Volta)'}
                            {entry.type === TimeEntryType.EXIT && 'Saída'}
                            {entry.type === TimeEntryType.OTHER && 'Outro'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {entry.documentId && (
                            <a
                              href={`/api/v1/documents/${entry.documentId._id || entry.documentId}/file`}
                              target="_blank"
                              rel="noreferrer"
                              title="Ver foto comprovante"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteEntry(entry._id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <a
                href={`/entry/new?date=${selectedDay.date}`}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Marcação Manual Neste Dia</span>
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Selecione um dia no calendário.</p>
          )}
        </div>
      </div>
    </div>
  );
};
