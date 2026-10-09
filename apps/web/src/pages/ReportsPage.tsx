import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { FileText, FileSpreadsheet, Download, FileCode, CheckCircle, Clock } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const downloadFile = async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    try {
      setDownloadingFormat(format);
      if (format === 'json') {
        const data = await apiRequest(`/reports/json?month=${selectedMonth}`);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        triggerDownload(blob, `espelho-${selectedMonth}.json`);
      } else if (format === 'csv') {
        const blob = await apiRequest<Blob>(`/reports/csv?month=${selectedMonth}`);
        triggerDownload(blob, `espelho-${selectedMonth}.csv`);
      } else if (format === 'excel') {
        const blob = await apiRequest<Blob>(`/reports/excel?month=${selectedMonth}`);
        triggerDownload(blob, `espelho-${selectedMonth}.xlsx`);
      } else if (format === 'pdf') {
        const blob = await apiRequest<Blob>(`/reports/pdf?month=${selectedMonth}`);
        triggerDownload(blob, `espelho-${selectedMonth}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao exportar relatório.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Relatórios & Exportações</h1>
          <p className="text-sm text-slate-500">Exporte espelhos de ponto e resumos consolidados em diversos formatos.</p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
          <Clock className="w-4 h-4 text-slate-400 ml-2" />
          <span className="text-xs font-semibold text-slate-600">Período:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF Exporter */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Espelho de Ponto em PDF</h3>
              <p className="text-xs text-slate-500 mt-1">
                Documento A4 diagramado profissionalmente com cabeçalho, tabela dia a dia, totais de jornada e rodapé legal.
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadFile('pdf')}
            disabled={!!downloadingFormat}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingFormat === 'pdf' ? 'Gerando PDF...' : 'Baixar Arquivo PDF'}</span>
          </button>
        </div>

        {/* Excel XLSX Exporter */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Planilha Excel (XLSX)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Planilha com colunas estruturadas, batidas de ponto, horas trabalhadas, horas previstas e cálculos de saldo.
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadFile('excel')}
            disabled={!!downloadingFormat}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingFormat === 'excel' ? 'Gerando XLSX...' : 'Baixar Planilha Excel'}</span>
          </button>
        </div>

        {/* CSV Exporter */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Arquivo CSV Delimitado</h3>
              <p className="text-xs text-slate-500 mt-1">
                Formato leve separado por ponto e vírgula, ideal para importar em softwares de contabilidade ou BI.
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadFile('csv')}
            disabled={!!downloadingFormat}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingFormat === 'csv' ? 'Gerando CSV...' : 'Baixar Arquivo CSV'}</span>
          </button>
        </div>

        {/* JSON Exporter */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Backup Estruturado (JSON)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Estrutura de dados completa para auditoria técnica, interoperabilidade ou backup pessoal dos registros.
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadFile('json')}
            disabled={!!downloadingFormat}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingFormat === 'json' ? 'Gerando JSON...' : 'Exportar Dados em JSON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
