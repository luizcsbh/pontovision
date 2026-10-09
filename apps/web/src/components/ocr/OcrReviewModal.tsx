import React, { useState } from 'react';
import { TimeEntryType, TimeEntrySource, maskCPF } from '@pontovision/shared';
import { CheckCircle2, AlertTriangle, X, ShieldAlert, Sparkles, Clock, Calendar, User, FileText } from 'lucide-react';

interface OcrReviewModalProps {
  documentId: string;
  ocrResult: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (entryData: {
    workDate: string;
    time: string;
    type: TimeEntryType;
    source: TimeEntrySource;
    documentId: string;
    notes?: string;
  }) => void;
}

export const OcrReviewModal: React.FC<OcrReviewModalProps> = ({
  documentId,
  ocrResult,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !ocrResult) return null;

  const fields = ocrResult.extractedFields || {};
  const [workDate, setWorkDate] = useState<string>(fields.date || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(fields.time || '08:00');
  const [type, setType] = useState<TimeEntryType>(TimeEntryType.ENTRY);
  const [notes, setNotes] = useState<string>(`Extraído via OCR (NSR: ${fields.nsr || 'N/A'})`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      workDate,
      time,
      type,
      source: TimeEntrySource.OCR_CONFIRMED,
      documentId,
      notes,
    });
  };

  const confidence = ocrResult.fieldConfidence?.overall || 0;
  const warnings: string[] = ocrResult.warnings || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Revisão de Reconhecimento OCR</h3>
              <p className="text-xs text-slate-500">Confira e ajuste os dados extraídos pelo Tesseract.js antes de consolidar.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lado Esquerdo: Imagem do Comprovante */}
          <div className="flex flex-col bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800">
            <div className="text-xs text-slate-400 mb-2 font-medium flex items-center justify-between">
              <span>Imagem do Comprovante</span>
              <span className="text-blue-400 font-semibold">Tesseract.js Local</span>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[280px]">
              <img
                src={`/api/v1/documents/${documentId}/file`}
                alt="Comprovante"
                className="max-h-[50vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>

          {/* Lado Direito: Campos Reconhecidos & Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Score de Confiança */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="text-slate-600 font-medium">Confiança do Reconhecimento:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full ${
                    confidence >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : confidence >= 50
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {Math.round(confidence)}%
                </span>
              </div>

              {warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Avisos de Validação:</span>
                  </div>
                  {warnings.map((w, idx) => (
                    <p key={idx} className="text-xs text-amber-800 ml-5">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Informações Auxiliares Reconhecidas */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Nome Detectado:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {fields.name || 'Não identificado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">CPF Identificado:</span>
                  <span className="font-semibold text-slate-800 block">
                    {fields.cpf ? maskCPF(fields.cpf) : 'Não identificado'}
                  </span>
                </div>
              </div>

              {/* Campos Editáveis para Confirmação */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Data da Marcação</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Horário (HH:mm)</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Marcação
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TimeEntryType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value={TimeEntryType.ENTRY}>Entrada (Início de Turno)</option>
                  <option value={TimeEntryType.INTERVAL_START}>Saída para Intervalo</option>
                  <option value={TimeEntryType.INTERVAL_END}>Retorno do Intervalo</option>
                  <option value={TimeEntryType.EXIT}>Saída Final</option>
                  <option value={TimeEntryType.OTHER}>Outra Marcação</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação / NSR
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: NSR 00012435 ou anotação"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Descartar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar & Salvar no Espelho</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
