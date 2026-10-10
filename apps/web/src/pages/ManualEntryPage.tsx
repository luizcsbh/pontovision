import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { TimeEntryType, TimeEntrySource } from '@pontovision/shared';
import { useModalAlert } from '../components/common/ModalAlert';
import { PlusCircle, Clock, Calendar, CheckCircle2, ArrowLeft, Hash } from 'lucide-react';

export const ManualEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useModalAlert();
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const [workDate, setWorkDate] = useState(initialDate);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [type, setType] = useState<TimeEntryType>(TimeEntryType.ENTRY);
  const [nsr, setNsr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await apiRequest('/entries', {
        method: 'POST',
        body: JSON.stringify({
          workDate,
          time,
          type,
          source: TimeEntrySource.MANUAL,
          nsr: nsr.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      navigate('/calendar');
    } catch (err: any) {
      const msg = err.message || 'Falha ao salvar marcação de ponto.';
      setErrorMsg(msg);
      showAlert({
        title: 'Não Foi Possível Gravar',
        message: msg,
        type: 'warning',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-5 sm:mb-6">
          <div className="p-2.5 sm:p-3 bg-blue-100 text-blue-700 rounded-2xl flex-shrink-0">
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Nova Marcação Manual</h1>
            <p className="text-xs text-slate-500">Cadastre uma batida de ponto sem necessidade de fotografia.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Data do Ponto</span>
              </label>
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo da Marcação
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TimeEntryType)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={TimeEntryType.ENTRY}>Entrada (Início de Turno)</option>
              <option value={TimeEntryType.INTERVAL_START}>Saída para Intervalo (Almoço)</option>
              <option value={TimeEntryType.INTERVAL_END}>Retorno do Intervalo</option>
              <option value={TimeEntryType.EXIT}>Saída Final</option>
              <option value={TimeEntryType.OTHER}>Outra Marcação</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Hash className="w-3.5 h-3.5 text-indigo-600" />
              <span>NSR - Número Sequencial de Registro (Opcional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={nsr}
              onChange={(e) => setNsr(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 000069071"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação / Motivo (Opcional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Trabalho externo, esquecimento de crachá ou batida manual autorizada"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Gravar Marcação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
