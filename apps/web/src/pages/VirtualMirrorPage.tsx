import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { minutesToTimeString, TimeEntryType, calculateExpirationDate } from '@pontovision/shared';
import { Printer, Download, ChevronLeft, ChevronRight, FileSpreadsheet, CalendarClock, AlertTriangle } from 'lucide-react';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const VirtualMirrorPage: React.FC = () => {
  const { user } = useAuth();
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [monthData, setMonthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMirror = async (ym: string) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/calendar/month?month=${ym}`);
      setMonthData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMirror(currentYearMonth);
  }, [currentYearMonth]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await apiRequest<Blob>(`/reports/pdf?month=${currentYearMonth}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `espelho-ponto-${currentYearMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await apiRequest<Blob>(`/reports/excel?month=${currentYearMonth}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `espelho-ponto-${currentYearMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden in Print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Espelho de Ponto Virtual</h1>
          <p className="text-sm text-slate-500">Documento estruturado idêntico ao modelo oficial de apuração CLT.</p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={currentYearMonth}
            onChange={(e) => setCurrentYearMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PDF</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (XLSX)</span>
          </button>
        </div>
      </div>

      {/* The Printable Timesheet Mirror Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-wide uppercase">
                PONTOVISION AI — ESPELHO DE PONTO ELETRÔNICO
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Relatório Pessoal de Marcações de Ponto (Conforme Portaria MTE 671)
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 font-mono">
              <div>Mês de Competência: <strong className="text-slate-900">{currentYearMonth}</strong></div>
              <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500">Colaborador:</span>{' '}
              <strong className="text-slate-800">{user?.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">CPF:</span>{' '}
              <strong className="text-slate-800 font-mono">{user?.cpfMasked || 'Não informado'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Jornada Contratual:</span>{' '}
              <strong className="text-slate-800">44h Semanais (CLT)</strong>
            </div>
          </div>

          {/* Card Resumo Banco de Horas & Vigência CLT (Art. 59 § 5º) */}
          {(monthData?.balanceMinutes > 0 || monthData?.days?.some((d: any) => d.calculation?.balanceMinutes > 0)) && (() => {
            const overtimeDays = (monthData?.days || []).filter((d: any) => d.calculation?.balanceMinutes > 0);
            const firstExp = monthData?.earliestExpirationDate || (overtimeDays[0] ? calculateExpirationDate(overtimeDays[0].date, 6) : null);
            const lastExp = monthData?.latestExpirationDate || (overtimeDays[overtimeDays.length - 1] ? calculateExpirationDate(overtimeDays[overtimeDays.length - 1].date, 6) : null);

            const formatBR = (iso: string) => {
              const [y, m, d] = iso.split('-');
              return `${d}/${m}/${y}`;
            };

            const expText = firstExp && lastExp
              ? firstExp === lastExp
                ? formatBR(firstExp)
                : `${formatBR(firstExp)} a ${formatBR(lastExp)}`
              : 'Em até 6 meses';

            return (
              <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Banco de Horas — Vigência Legal de 6 Meses (Art. 59, § 5º da CLT)
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Horas extras desta competência possuem prazo legal de <strong>6 meses contados a partir do dia em que foram geradas</strong> (data da marcação do ponto). Decorrido este prazo, deverão ser <strong>pagas com acréscimo legal mínimo de 50%</strong> (vencimento: <strong>{expText}</strong>).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-slate-600">Saldo Positivo:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    {minutesToTimeString(monthData?.balanceMinutes > 0 ? monthData.balanceMinutes : 0, true)}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Timesheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-2">Dia</th>
                <th className="py-2.5 px-3">Entrada 1</th>
                <th className="py-2.5 px-3">Saída Int.</th>
                <th className="py-2.5 px-3">Retorno Int.</th>
                <th className="py-2.5 px-3">Saída 2</th>
                <th className="py-2.5 px-3 text-right">Trabalhado</th>
                <th className="py-2.5 px-3 text-right">Previsto</th>
                <th className="py-2.5 px-3 text-right">Saldo</th>
                <th className="py-2.5 px-3 text-center">Vcto. CLT (+6m)</th>
                <th className="py-2.5 px-3">Ocorrências / Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {monthData?.days?.map((d: any) => {
                const entries = d.calculation.entries || [];
                const e1 = entries[0]?.time || '-';
                const e2 = entries[1]?.time || '-';
                const e3 = entries[2]?.time || '-';
                const e4 = entries[3]?.time || '-';
                const workedMin = d.calculation.totalWorkedMinutes;
                const expectedMin = d.calculation.expectedWorkMinutes;
                const balanceMin = d.calculation.balanceMinutes;

                return (
                  <tr
                    key={d.date}
                    className={`hover:bg-slate-50/80 ${
                      d.isHoliday ? 'bg-amber-50/30' : d.calculation.isIncomplete ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-800">{d.date.slice(8)}/{d.date.slice(5, 7)}</td>
                    <td className="py-2 px-2 text-slate-500">{WEEKDAYS[d.dayOfWeek]}</td>
                    <td className="py-2 px-3 text-slate-700">{e1}</td>
                    <td className="py-2 px-3 text-slate-700">{e2}</td>
                    <td className="py-2 px-3 text-slate-700">{e3}</td>
                    <td className="py-2 px-3 text-slate-700">{e4}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      {workedMin > 0 ? minutesToTimeString(workedMin) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {expectedMin > 0 ? minutesToTimeString(expectedMin) : '-'}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        balanceMin > 0
                          ? 'text-emerald-600'
                          : balanceMin < 0
                          ? 'text-red-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {balanceMin !== 0 ? minutesToTimeString(balanceMin, true) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {balanceMin > 0 ? (() => {
                        const expIso = d.calculation.expirationDate || calculateExpirationDate(d.date, 6);
                        const [ey, em, ed] = expIso.split('-');
                        const expFormatted = `${ed}/${em}/${ey}`;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const expDateObj = new Date(parseInt(ey, 10), parseInt(em, 10) - 1, parseInt(ed, 10));
                        const isExpired = expDateObj.getTime() < today.getTime();

                        return isExpired ? (
                          <span className="inline-block text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300" title="Prazo de 6 meses expirado: Pagar com adicional!">
                            {expFormatted} ⚠
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Limite legal para compensação ou pagamento">
                            {expFormatted}
                          </span>
                        );
                      })() : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-600">
                      {d.isHoliday ? (
                        <span className="text-amber-700 font-semibold">Feriado: {d.holidayName}</span>
                      ) : d.calculation.isIncomplete ? (
                        <span className="text-red-600 font-semibold">Registro Incompleto</span>
                      ) : (
                        entries.some((e: any) => e.source === 'OCR_CONFIRMED') ? 'OCR Local' : 'Regular'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-slate-900">
                <td colSpan={6} className="py-3 px-3 uppercase text-right font-sans">
                  Totais Consolidados do Período:
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  {minutesToTimeString(monthData?.totalWorkedMinutes || 0)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  {minutesToTimeString(monthData?.totalExpectedMinutes || 0)}
                </td>
                <td
                  className={`py-3 px-3 text-right font-mono text-sm ${
                    (monthData?.balanceMinutes || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {minutesToTimeString(monthData?.balanceMinutes || 0, true)}
                </td>
                <td className="py-3 px-3 text-center font-sans text-[11px] text-emerald-800 font-semibold">
                  {(() => {
                    const overtimeDays = (monthData?.days || []).filter((d: any) => d.calculation?.balanceMinutes > 0);
                    if (overtimeDays.length === 0) return '-';
                    const firstExp = monthData?.earliestExpirationDate || calculateExpirationDate(overtimeDays[0].date, 6);
                    const lastExp = monthData?.latestExpirationDate || calculateExpirationDate(overtimeDays[overtimeDays.length - 1].date, 6);
                    const formatBR = (iso: string) => {
                      const [y, m, d] = iso.split('-');
                      return `${d}/${m}/${y}`;
                    };
                    return firstExp === lastExp
                      ? `Vcto: ${formatBR(firstExp)}`
                      : `Vcto: ${formatBR(firstExp)} a ${formatBR(lastExp)}`;
                  })()}
                </td>
                <td className="py-3 px-3 font-sans text-xs">
                  Incompletos: {monthData?.incompleteDaysCount || 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Nota Legal CLT Art. 59 § 5º */}
        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">
            Regulamentação CLT — Banco de Horas (Art. 59, § 5º):
          </p>
          <p>
            O banco de horas acordado individualmente é válido por até 6 (seis) meses. As horas extras acumuladas não compensadas dentro deste prazo deverão ser pagas com o acréscimo legal de 50% sobre o valor da hora normal.
          </p>
        </div>

        {/* Disclaimer / Rodapé */}
        <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center">
          Documento gerado para controle e conciliação individual de marcações com OCR estritamente local (PontoVision AI).
        </div>
      </div>
    </div>
  );
};
