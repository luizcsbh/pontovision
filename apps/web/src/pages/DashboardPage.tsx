import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { minutesToTimeString, TimeEntryType, TimeEntrySource } from '@pontovision/shared';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Camera,
  PlusCircle,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [loading, setLoading] = useState(true);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summary, entries] = await Promise.all([
          apiRequest<any>(`/calendar/month?month=${currentMonth}`),
          apiRequest<any[]>('/entries'),
        ]);
        setMonthSummary(summary);
        setRecentEntries(entries.slice(-5).reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const worked = monthSummary?.totalWorkedMinutes || 0;
  const expected = monthSummary?.totalExpectedMinutes || 0;
  const balance = monthSummary?.balanceMinutes || 0;
  const incomplete = monthSummary?.incompleteDaysCount || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-blue-200">
            Painel Geral
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold mt-2 sm:mt-3">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 leading-relaxed">
            Aqui está a apuração das suas marcações no mês {currentMonth}. O processamento OCR funciona 100% no seu dispositivo.
          </p>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link
              to="/capture"
              className="px-4 py-2.5 bg-white text-blue-800 font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Digitalizar Ponto (OCR)</span>
            </Link>
            <Link
              to="/entry/new"
              className="px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Marcação Manual</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid (2x2 on mobile, 4 columns on large screens) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase truncate">Horas Realizadas</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-800 font-mono sm:font-sans">
            {minutesToTimeString(worked)}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Neste mês</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase truncate">Horas Previstas</span>
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-800 font-mono sm:font-sans">
            {minutesToTimeString(expected)}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Jornada contratual</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase truncate">Saldo Acumulado</span>
            <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`} />
          </div>
          <div className={`text-lg sm:text-2xl font-black font-mono sm:font-sans ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {minutesToTimeString(balance, true)}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">{balance >= 0 ? 'Horas extras' : 'A compensar'}</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase truncate">Inconsistências</span>
            <AlertTriangle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${incomplete > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-lg sm:text-2xl font-black ${incomplete > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {incomplete} {incomplete === 1 ? 'dia' : 'dias'}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">{incomplete > 0 ? 'Ímpares pendentes' : 'Regularizado'}</p>
        </div>
      </div>

      {/* Recent Entries & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-base">Últimas Marcações</h2>
            <Link to="/virtual-mirror" className="text-xs font-semibold text-blue-600 hover:underline">
              Ver espelho completo &rarr;
            </Link>
          </div>

          {recentEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Nenhuma batida registrada ainda. Fotografe seu primeiro comprovante!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEntries.map((e) => (
                <div key={e._id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 bg-slate-100 font-mono font-bold text-slate-700 text-xs rounded-lg">
                      {e.time}
                    </span>
                    <div>
                      <span className="font-medium text-slate-800 block">
                        {e.type === TimeEntryType.ENTRY && 'Entrada'}
                        {e.type === TimeEntryType.INTERVAL_START && 'Saída para Intervalo'}
                        {e.type === TimeEntryType.INTERVAL_END && 'Retorno do Intervalo'}
                        {e.type === TimeEntryType.EXIT && 'Saída Final'}
                        {e.type === TimeEntryType.OTHER && 'Outro'}
                      </span>
                      <span className="text-xs text-slate-400">{e.workDate}</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      e.source === TimeEntrySource.OCR_CONFIRMED
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {e.source === TimeEntrySource.OCR_CONFIRMED ? 'OCR Local' : 'Manual'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 text-base mb-2">Acesso Rápido</h2>
          
          <Link
            to="/virtual-mirror"
            className="p-3.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl flex items-center space-x-3 transition-all block group"
          >
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Espelho Virtual de Ponto</div>
              <div className="text-xs text-slate-400">Tabela diária estilo cartão tradicional</div>
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-3.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl flex items-center space-x-3 transition-all block group"
          >
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Exportar em PDF & Excel</div>
              <div className="text-xs text-slate-400">Download em PDF, XLSX, CSV e JSON</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
