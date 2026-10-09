import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { minutesToTimeString, TimeEntryType, TimeEntrySource } from '@pontovision/shared';
import {
  ChevronLeft, ChevronRight, AlertTriangle, Clock, Plus, Trash2,
  FileText, Edit3, CheckCircle2, X, Camera, Upload, Keyboard,
  Loader2, Image as ImageIcon, Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const ENTRY_TYPE_LABELS: Record<string, string> = {
  [TimeEntryType.ENTRY]:          '🟢 Entrada',
  [TimeEntryType.INTERVAL_START]: '🟡 Saída Almoço',
  [TimeEntryType.INTERVAL_END]:   '🟡 Volta Almoço',
  [TimeEntryType.EXIT]:           '🔴 Saída',
  [TimeEntryType.OTHER]:          '⚪ Outro',
};

const ENTRY_TYPE_BADGE: Record<string, string> = {
  [TimeEntryType.ENTRY]:          'bg-emerald-100 text-emerald-800',
  [TimeEntryType.INTERVAL_START]: 'bg-amber-100 text-amber-800',
  [TimeEntryType.INTERVAL_END]:   'bg-amber-100 text-amber-800',
  [TimeEntryType.EXIT]:           'bg-red-100 text-red-800',
  [TimeEntryType.OTHER]:          'bg-slate-100 text-slate-700',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────
// Sub-modal: Editar marcação existente
// ─────────────────────────────────────────────
interface EditEntryModalProps {
  entry: any;
  onClose: () => void;
  onSaved: () => void;
}
const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, onClose, onSaved }) => {
  const [time, setTime]   = useState(entry.time?.slice(0,5) || '');
  const [type, setType]   = useState<TimeEntryType>(entry.type);
  const [notes, setNotes] = useState(entry.notes || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await apiRequest(`/entries/${entry._id}`, {
        method: 'PUT',
        body: JSON.stringify({ time, type, notes: notes.trim() || undefined }),
      });
      onSaved();
      onClose();
    } catch (error: any) {
      setErr(error.message || 'Falha ao salvar.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Editar Marcação</h3>
              <p className="text-xs text-slate-400">{entry.workDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {err}
            </div>
          )}

          {/* Horário */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Horário
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TimeEntryType)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              {Object.entries(ENTRY_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observação</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo ou anotação (opcional)"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Painel de adicionar marcação (inline no sidebar)
// ─────────────────────────────────────────────
type AddMode = 'choose' | 'manual' | 'ocr';

interface AddEntryPanelProps {
  date: string;
  onSaved: () => void;
  onCancel: () => void;
}
const AddEntryPanel: React.FC<AddEntryPanelProps> = ({ date, onSaved, onCancel }) => {
  const [mode, setMode] = useState<AddMode>('choose');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [manTime, setManTime]   = useState(nowHHMM);
  const [manType, setManType]   = useState<TimeEntryType>(TimeEntryType.ENTRY);
  const [manNotes, setManNotes] = useState('');
  const [manSaving, setManSaving] = useState(false);
  const [manErr, setManErr] = useState('');

  // OCR state
  const [ocrFile, setOcrFile]         = useState<File | null>(null);
  const [ocrPreview, setOcrPreview]   = useState<string | null>(null);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult]     = useState<any>(null);
  const [ocrDocId, setOcrDocId]       = useState('');
  const [ocrErr, setOcrErr]           = useState('');
  // Review fields
  const [ocrTime, setOcrTime]   = useState('');
  const [ocrType, setOcrType]   = useState<TimeEntryType>(TimeEntryType.ENTRY);
  const [ocrNotes, setOcrNotes] = useState('');
  const [ocrConfirming, setOcrConfirming] = useState(false);

  // Manual submit
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setManSaving(true); setManErr('');
    try {
      await apiRequest('/entries', {
        method: 'POST',
        body: JSON.stringify({
          workDate: date,
          time: manTime,
          type: manType,
          source: TimeEntrySource.MANUAL,
          notes: manNotes.trim() || undefined,
        }),
      });
      onSaved();
    } catch (error: any) {
      setManErr(error.message || 'Erro ao salvar.');
      setManSaving(false);
    }
  };

  // Foto/upload selecionada
  const handleFileSelected = async (file: File) => {
    setOcrFile(file);
    setOcrErr('');
    setOcrResult(null);
    setOcrPreview(URL.createObjectURL(file));
    setMode('ocr');

    // 1. Upload
    setOcrUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const doc = await apiRequest('/documents/upload', { method: 'POST', body: formData });
      setOcrDocId(doc._id);

      // 2. Processar OCR
      setOcrUploading(false);
      setOcrProcessing(true);
      const result = await apiRequest(`/ocr/process/${doc._id}`, { method: 'POST' });
      setOcrResult(result);
      const fields = result.extractedFields || {};
      setOcrTime(fields.time || nowHHMM());
      setOcrNotes(`NSR: ${fields.nsr || 'N/A'} · ${fields.name || ''}`);
    } catch (err: any) {
      setOcrErr(err.message || 'Falha ao processar imagem.');
    } finally {
      setOcrUploading(false);
      setOcrProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  // Confirmar OCR como marcação
  const handleOcrConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcrConfirming(true);
    try {
      await apiRequest('/entries', {
        method: 'POST',
        body: JSON.stringify({
          workDate: date,
          time: ocrTime,
          type: ocrType,
          source: TimeEntrySource.OCR_CONFIRMED,
          documentId: ocrDocId,
          notes: ocrNotes.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setOcrErr(err.message || 'Erro ao confirmar.');
      setOcrConfirming(false);
    }
  };

  // ── Escolha de modo ──
  if (mode === 'choose') {
    return (
      <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/40 p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
            Adicionar marcação — {date}
          </p>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-blue-100 text-blue-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Câmera nativa (mobile) */}
        <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-200 transition-colors">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Tirar Foto</p>
            <p className="text-xs text-slate-500">Abre a câmera do celular diretamente</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Upload de galeria / arquivo */}
        <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all group">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl group-hover:bg-purple-200 transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Selecionar Arquivo</p>
            <p className="text-xs text-slate-500">Galeria, downloads ou Google Drive</p>
          </div>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Entrada manual */}
        <button
          onClick={() => setMode('manual')}
          className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 w-full text-left hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl group-hover:bg-emerald-200 transition-colors">
            <Keyboard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Digitação Manual</p>
            <p className="text-xs text-slate-500">Informe o horário sem foto</p>
          </div>
        </button>
      </div>
    );
  }

  // ── Formulário manual ──
  if (mode === 'manual') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" /> Digitação Manual · {date}
          </p>
          <button
            onClick={() => setMode('choose')}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-500 text-xs font-medium"
          >
            ← Voltar
          </button>
        </div>

        <form onSubmit={handleManualSave} className="space-y-3">
          {manErr && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{manErr}</div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horário</label>
              <input
                type="time"
                required
                value={manTime}
                onChange={(e) => setManTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
              <select
                value={manType}
                onChange={(e) => setManType(e.target.value as TimeEntryType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {Object.entries(ENTRY_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observação</label>
            <input
              type="text"
              value={manNotes}
              onChange={(e) => setManNotes(e.target.value)}
              placeholder="Motivo (opcional)"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >Cancelar</button>
            <button
              type="submit"
              disabled={manSaving}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
            >
              {manSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {manSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Fluxo OCR ──
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> OCR Comprovante · {date}
        </p>
        <button
          onClick={() => { setMode('choose'); setOcrPreview(null); setOcrResult(null); }}
          className="p-1 rounded-lg hover:bg-blue-100 text-blue-400 text-xs font-medium"
        >
          ← Voltar
        </button>
      </div>

      {/* Preview da imagem */}
      {ocrPreview && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
          <img
            src={ocrPreview}
            alt="Comprovante"
            className="w-full max-h-40 object-contain"
          />
          {(ocrUploading || ocrProcessing) && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <p className="text-white text-xs font-semibold">
                {ocrUploading ? 'Enviando imagem...' : 'Processando OCR...'}
              </p>
            </div>
          )}
        </div>
      )}

      {ocrErr && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {ocrErr}
        </div>
      )}

      {/* Resultado OCR para confirmar */}
      {ocrResult && !ocrUploading && !ocrProcessing && (
        <form onSubmit={handleOcrConfirm} className="space-y-3">
          {/* Dados extraídos */}
          {ocrResult.extractedFields && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Dados Extraídos pelo OCR
              </p>
              {ocrResult.extractedFields.name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-semibold text-slate-800">{ocrResult.extractedFields.name}</span>
                </div>
              )}
              {ocrResult.extractedFields.cpf && (
                <div className="flex justify-between">
                  <span className="text-slate-500">CPF:</span>
                  <span className="font-mono font-semibold text-slate-800">{ocrResult.extractedFields.cpf}</span>
                </div>
              )}
              {ocrResult.extractedFields.date && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Data no comprovante:</span>
                  <span className="font-mono font-semibold text-slate-800">{ocrResult.extractedFields.date}</span>
                </div>
              )}
              {ocrResult.extractedFields.time && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Hora no comprovante:</span>
                  <span className="font-mono font-bold text-blue-700">{ocrResult.extractedFields.time}</span>
                </div>
              )}
              {ocrResult.extractedFields.nsr && (
                <div className="flex justify-between">
                  <span className="text-slate-500">NSR:</span>
                  <span className="font-mono font-semibold text-slate-800">{ocrResult.extractedFields.nsr}</span>
                </div>
              )}
              {/* Confiança */}
              <div className="flex justify-between pt-1 border-t border-slate-100 mt-1">
                <span className="text-slate-500">Confiança OCR:</span>
                <span className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                  (ocrResult.fieldConfidence?.overall || 0) >= 70
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {Math.round(ocrResult.fieldConfidence?.overall || 0)}%
                </span>
              </div>
            </div>
          )}

          {/* Avisos */}
          {ocrResult.warnings?.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              {ocrResult.warnings.map((w: string, i: number) => (
                <p key={i}>⚠ {w}</p>
              ))}
            </div>
          )}

          {/* Confirmar horário */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ✏️ Confirmar Hora
              </label>
              <input
                type="time"
                required
                value={ocrTime}
                onChange={(e) => setOcrTime(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
              <select
                value={ocrType}
                onChange={(e) => setOcrType(e.target.value as TimeEntryType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {Object.entries(ENTRY_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observação</label>
            <input
              type="text"
              value={ocrNotes}
              onChange={(e) => setOcrNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
            >Cancelar</button>
            <button
              type="submit"
              disabled={ocrConfirming}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {ocrConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {ocrConfirming ? 'Salvando...' : 'Confirmar & Salvar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────
export const CalendarPage: React.FC = () => {
  const [currentYearMonth, setCurrentYearMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [monthData, setMonthData] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const fetchMonth = useCallback(async (ym: string) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/calendar/month?month=${ym}`);
      setMonthData(data);
      setSelectedDay((prev: any) => {
        if (prev) {
          return data.days.find((d: any) => d.date === prev.date) || data.days[0];
        }
        // Seleciona hoje ou primeiro dia
        const today = todayISO();
        return data.days.find((d: any) => d.date === today) || data.days[0];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMonth(currentYearMonth); }, [currentYearMonth, fetchMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentYearMonth.split('-').map(Number);
    setCurrentYearMonth(new Date(y, m - 2, 1).toISOString().slice(0, 7));
  };
  const handleNextMonth = () => {
    const [y, m] = currentYearMonth.split('-').map(Number);
    setCurrentYearMonth(new Date(y, m, 1).toISOString().slice(0, 7));
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Remover esta marcação?')) return;
    try {
      await apiRequest(`/entries/${entryId}`, { method: 'DELETE' });
      fetchMonth(currentYearMonth);
    } catch (err) { console.error(err); }
  };

  const handleSaved = () => {
    setShowAddPanel(false);
    setEditingEntry(null);
    fetchMonth(currentYearMonth);
  };

  if (loading && !monthData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Mês por extenso
  const [y, m] = currentYearMonth.split('-').map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 capitalize">Calendário de Ponto</h1>
          <p className="text-sm text-slate-500">
            Visualização interativa com detecção CLT, edição e captura de comprovante.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-800 px-3 text-sm capitalize">{monthLabel}</span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Grade do mês ── */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Espaços vazios iniciais */}
            {monthData?.days?.[0] &&
              Array.from({ length: monthData.days[0].dayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] rounded-2xl bg-slate-50/60 border border-dashed border-slate-100" />
              ))}

            {monthData?.days?.map((day: any) => {
              const isSelected   = selectedDay?.date === day.date;
              const isToday      = day.date === todayISO();
              const hasPunches   = day.calculation.entries.length > 0;
              const workedMin    = day.calculation.totalWorkedMinutes;
              const balanceMin   = day.calculation.balanceMinutes;
              const incomplete   = day.calculation.isIncomplete;

              return (
                <div
                  key={day.date}
                  onClick={() => { setSelectedDay(day); setShowAddPanel(false); }}
                  className={`min-h-[80px] p-2 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400/25 shadow-sm'
                      : isToday
                      ? 'border-blue-300 bg-blue-50/40 hover:border-blue-400'
                      : day.isHoliday
                      ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                      : incomplete
                      ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Número do dia + badges */}
                  <div className="flex items-start justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                      {parseInt(day.date.slice(8), 10)}
                    </span>
                    <div className="flex flex-col items-end gap-0.5">
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Hoje" />}
                      {day.isHoliday && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`Feriado: ${day.holidayName}`} />}
                      {incomplete && <span title="Incompleto"><AlertTriangle className="w-3 h-3 text-red-500" /></span>}
                    </div>
                  </div>

                  {/* Horas / saldo */}
                  {hasPunches ? (
                    <div>
                      <div className="text-[11px] font-mono font-bold text-slate-800">
                        {minutesToTimeString(workedMin)}
                      </div>
                      <div className={`text-[10px] font-medium ${
                        balanceMin > 0 ? 'text-emerald-600' : balanceMin < 0 ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {balanceMin !== 0 ? minutesToTimeString(balanceMin, true) : '—'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300">
                      {day.isHoliday ? 'Feriado' : '—'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Hoje</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Feriado</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500"/>Inconsistência</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">+hh:mm Hora extra</span>
            <span className="flex items-center gap-1 text-red-500 font-medium">-hh:mm Débito</span>
          </div>
        </div>

        {/* ── Painel do dia ── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
          {selectedDay ? (
            <>
              {/* Cabeçalho dia */}
              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Detalhes</span>
                <h3 className="text-lg font-black text-slate-800 mt-0.5 capitalize">
                  {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </h3>
                {selectedDay.isHoliday && (
                  <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 font-medium rounded-full">
                    🎉 {selectedDay.holidayName}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Trabalhado</span>
                  <span className="text-base font-bold text-slate-800 font-mono">
                    {minutesToTimeString(selectedDay.calculation.totalWorkedMinutes)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Saldo</span>
                  <span className={`text-base font-bold font-mono ${
                    selectedDay.calculation.balanceMinutes >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {minutesToTimeString(selectedDay.calculation.balanceMinutes, true)}
                  </span>
                </div>
              </div>

              {/* Alertas */}
              {selectedDay.calculation.warnings?.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Inconsistência:
                  </div>
                  {selectedDay.calculation.warnings.map((w: string, i: number) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}

              {/* Lista de marcações */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Marcações Registradas
                </h4>
                {selectedDay.calculation.entries.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                    Nenhuma marcação neste dia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDay.calculation.entries.map((entry: any) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        {/* Hora + tipo */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-slate-800 text-sm bg-white border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                            {entry.time?.slice(0,5)}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${ENTRY_TYPE_BADGE[entry.type] || 'bg-slate-100 text-slate-600'}`}>
                            {ENTRY_TYPE_LABELS[entry.type] || entry.type}
                          </span>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Ver comprovante */}
                          {entry.documentId && (
                            <a
                              href={`/api/v1/documents/${entry.documentId?._id || entry.documentId}/file`}
                              target="_blank"
                              rel="noreferrer"
                              title="Ver comprovante"
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {/* Editar */}
                          <button
                            onClick={() => setEditingEntry(entry)}
                            title="Editar marcação"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Excluir */}
                          <button
                            onClick={() => handleDeleteEntry(entry._id)}
                            title="Remover"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar marcação */}
              {showAddPanel ? (
                <AddEntryPanel
                  date={selectedDay.date}
                  onSaved={handleSaved}
                  onCancel={() => setShowAddPanel(false)}
                />
              ) : (
                <button
                  onClick={() => setShowAddPanel(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Marcação
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">
              Selecione um dia no calendário.
            </p>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};
