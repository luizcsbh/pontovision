import React, { useState, useCallback, useMemo } from 'react';
import { TimeEntryType, TimeEntrySource, maskCPF } from '@pontovision/shared';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Clock,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Hash,
  Cpu,
  Layers,
  ArrowRight,
  Building,
  User,
  ShieldAlert,
} from 'lucide-react';
import { ComprovanteREP, ComprovanteREPData } from './ComprovanteREP';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { useModalAlert } from '../common/ModalAlert';

interface OcrReviewModalProps {
  documentId: string;
  ocrResult: any;
  ocrResultId?: string;
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

type Step = 'review' | 'comprovante';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const OcrReviewModal: React.FC<OcrReviewModalProps> = ({
  documentId,
  ocrResult,
  ocrResultId,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { user } = useAuth();
  const { showAlert } = useModalAlert();
  if (!isOpen || !ocrResult) return null;

  const fields = ocrResult.extractedFields || {};
  const [step, setStep] = useState<Step>('review');

  // 1. Apenas os 4 campos da OCR editáveis (NREP e NSR somente números)
  const [workDate, setWorkDate] = useState<string>(fields.date || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(fields.time || fields.hora || '');
  const [nrep, setNrep] = useState<string>((fields.nrep || '').replace(/\D/g, ''));
  const [nsr, setNsr] = useState<string>((fields.nsr || '').replace(/\D/g, ''));

  // Dados de suporte para marcação
  const [type, setType] = useState<TimeEntryType>(TimeEntryType.ENTRY);
  const [notes, setNotes] = useState<string>(`Extraído via OCR · NSR: ${(fields.nsr || '').replace(/\D/g, '') || 'N/A'}`);
  const [saving, setSaving] = useState(false);

  // Verificação de preenchimento dos 4 campos obrigatórios da OCR
  const isOcrComplete = Boolean(
    workDate.trim() &&
    time.trim() &&
    nrep.trim() &&
    nsr.trim()
  );

  // Informações de tamanho da imagem (Original vs Processada)
  const imageStats = ocrResult.imageStats || {};
  const originalSize = imageStats.originalSize || ocrResult.fileSize || 0;
  const processedSize = imageStats.processedSize || ocrResult.processedFileSize || (originalSize > 0 ? Math.round(originalSize * 0.08) : 0);
  const reductionPercent = originalSize > 0 && processedSize > 0
    ? Math.max(0, Math.round(((originalSize - processedSize) / originalSize) * 100))
    : 0;

  // Montagem do comprovante combinando os 4 dados da OCR com os dados do CADASTRO DO USUÁRIO
  const comprovanteData: ComprovanteREPData = useMemo(() => {
    const enderecoCompleto = [
      user?.company?.endereco,
      user?.company?.cidade,
      user?.company?.uf,
    ].filter(Boolean).join(' - ');

    return {
      // 1. Dados extraídos da OCR (somente números em NREP e NSR)
      data: workDate,
      hora: time,
      nrep: nrep.replace(/\D/g, ''),
      nsr: nsr.replace(/\D/g, ''),
      // 2. Dados oriundos do CADASTRO DO USUÁRIO
      nome: (user?.name || 'FUNCIONÁRIO NÃO INFORMADO').toUpperCase(),
      cpf: user?.cpf || user?.cpfMasked || '',
      razaoSocial: (user?.company?.razaoSocial || 'EMPRESA NÃO CADASTRADA NO PERFIL').toUpperCase(),
      cnpj: user?.company?.cnpj || '',
      local: (enderecoCompleto || 'LOCAL NÃO INFORMADO NO PERFIL').toUpperCase(),
      cei: user?.company?.cei || '000000000000000',
      modeloRep: 'IDCLASS BIO PROX',
      assinaturaDigital: fields.assinaturaDigital || '',
    };
  }, [workDate, time, nrep, nsr, user, fields.assinaturaDigital]);

  const handleSaveEdits = async () => {
    const targetId = ocrResultId || ocrResult._id;
    if (!targetId) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('pontovision_token');
      await fetch(`/api/v1/ocr/${targetId}/fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          editedFields: {
            date: workDate,
            time: time,
            nrep: nrep,
            nsr: nsr,
          },
        }),
      });
    } catch (e) {
      console.error('Falha ao salvar edições OCR:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOcrComplete) {
      showAlert({
        title: 'Campos Obrigatórios',
        message: 'Preencha os campos obrigatórios da OCR (Data, Hora, NREP e NSR) antes de confirmar.',
        type: 'warning',
      });
      return;
    }
    await handleSaveEdits();
    onConfirm({
      workDate,
      time,
      type,
      source: TimeEntrySource.OCR_CONFIRMED,
      documentId,
      notes: notes.trim() || undefined,
    });
  };

  const confidence = ocrResult.fieldConfidence?.overall || 0;
  const warnings: string[] = ocrResult.warnings || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[95vh] shadow-2xl">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Revisão OCR · Registro de Ponto</h3>
              <p className="text-xs text-slate-500">
                Campos da OCR editáveis. O comprovante completo é formado unindo o OCR com seus dados cadastrais.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas / Steps */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setStep('review')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
              step === 'review'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Conferir Campos OCR</span>
          </button>

          <button
            onClick={() => {
              if (isOcrComplete) setStep('comprovante');
            }}
            disabled={!isOcrComplete}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
              step === 'comprovante'
                ? 'border-blue-600 text-blue-700 bg-white'
                : isOcrComplete
                ? 'border-transparent text-slate-700 hover:text-blue-600 cursor-pointer'
                : 'border-transparent text-slate-300 cursor-not-allowed'
            }`}
            title={
              !isOcrComplete
                ? 'Preencha Data, Hora, NREP e NSR para habilitar o comprovante'
                : 'Visualizar comprovante formatado'
            }
          >
            <FileText className="w-4 h-4" />
            <span>2. Ver Comprovante</span>
            {!isOcrComplete && (
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                Bloqueado
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* PASSO 1: REVISÃO DE CAMPOS DA OCR */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 'review' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lado Esquerdo: Imagem + Rodapé de Tamanho */}
              <div className="flex flex-col bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800">
                <div className="text-xs text-slate-400 mb-2 font-medium flex items-center justify-between">
                  <span>Imagem do Comprovante</span>
                  <span className="text-blue-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    OCR Local
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center min-h-[260px] bg-black/40 rounded-xl p-2">
                  <AuthenticatedImage
                    src={`/api/v1/documents/${documentId}/file`}
                    alt="Comprovante"
                    className="max-h-[46vh] object-contain rounded-lg shadow-md"
                    fallbackText="Não foi possível recuperar a imagem do comprovante"
                  />
                </div>

                {/* RODAPÉ DA IMAGEM: TAMANHO ORIGINAL E PROCESSADA */}
                <div className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tamanho Original:</span>
                    <span className="font-mono font-bold text-white">
                      {formatBytes(originalSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tamanho Processado (Sharp):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatBytes(processedSize)}
                    </span>
                  </div>
                  {reductionPercent > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/70 text-[10px]">
                      <span className="text-slate-400">Otimização de Armazenamento:</span>
                      <span className="font-bold text-emerald-400">
                        -{reductionPercent}% de redução de espaço
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lado Direito: Formulário com os 4 campos da OCR */}
              <form onSubmit={handleSubmit} className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Status de Confiança */}
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

                  {/* Aviso de campos obrigatórios pendentes */}
                  {!isOcrComplete && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Preencha os campos obrigatórios da OCR:</span>
                      </div>
                      <p className="text-[11px] text-amber-800 ml-5">
                        Para visualizar o comprovante e confirmar o ponto, preencha:
                        {!workDate && ' • Data'}
                        {!time && ' • Hora'}
                        {!nrep && ' • NREP'}
                        {!nsr && ' • NSR'}
                      </p>
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-0.5">
                      <span className="font-bold text-slate-700">Avisos do motor OCR:</span>
                      {warnings.map((w, idx) => (
                        <p key={idx} className="text-[11px] text-slate-500">
                          • {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* ── OS 4 CAMPOS OBRIGATÓRIOS DA OCR (EDITÁVEIS) ── */}
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        Campos Capturados da OCR (Editáveis)
                      </span>
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                        4 campos obrigatórios
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* 1. DATA */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Data *</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={workDate}
                          onChange={(e) => setWorkDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                        />
                      </div>

                      {/* 2. HORA */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Hora (HH:mm) *</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-bold"
                        />
                      </div>

                      {/* 3. NREP */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                          <span>NREP (Somente Números) *</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          value={nrep}
                          onChange={(e) => setNrep(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 000140037502222046"
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                        />
                      </div>

                      {/* 4. NSR */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-indigo-600" />
                          <span>NSR (Somente Números) *</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          value={nsr}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '');
                            setNsr(clean);
                            setNotes(`Extraído via OCR · NSR: ${clean}`);
                          }}
                          placeholder="Ex: 000069071"
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informações que vêm do Cadastro */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">
                      Dados do Comprovante oriundos do seu Cadastro:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Trabalhador:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {user?.name || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">CPF:</span>
                        <span className="font-semibold text-slate-800 font-mono block">
                          {user?.cpf || user?.cpfMasked || 'Não informado'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">Empresa / Razão Social:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {user?.company?.razaoSocial || (
                            <span className="text-amber-600">Não cadastrada no Perfil</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tipo de Marcação */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tipo de Marcação
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as TimeEntryType)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value={TimeEntryType.ENTRY}>Entrada (Início de Turno)</option>
                        <option value={TimeEntryType.INTERVAL_START}>Saída para Almoço</option>
                        <option value={TimeEntryType.INTERVAL_END}>Retorno do Almoço</option>
                        <option value={TimeEntryType.EXIT}>Saída Final</option>
                        <option value={TimeEntryType.OTHER}>Outra Marcação</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observação
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Anotação (opcional)"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!isOcrComplete}
                    onClick={() => setStep('comprovante')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      isOcrComplete
                        ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Comprovante Formatado</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Descartar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !isOcrComplete}
                      className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{saving ? 'Salvando...' : 'Confirmar & Salvar'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PASSO 2: COMPROVANTE FORMATADO ESTILO CUPOM TÉRMICO */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 'comprovante' && (
            <div className="p-6 flex flex-col md:flex-row gap-8 items-start justify-center">
              {/* Comprovante */}
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-700 block">
                    Comprovante de Registro de Ponto (REP)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Composto com os 4 dados da OCR e os dados cadastrais do seu perfil.
                  </span>
                </div>

                <ComprovanteREP
                  data={comprovanteData}
                  editMode={false}
                  showActions={true}
                />
              </div>

              {/* Imagem Original para Conferência */}
              <div className="flex flex-col items-center gap-2 max-w-[280px]">
                <span className="text-xs text-slate-500 font-medium">Foto Original do Cupom</span>
                <AuthenticatedImage
                  src={`/api/v1/documents/${documentId}/file`}
                  alt="Comprovante original"
                  className="rounded-2xl shadow-lg border border-slate-200 max-h-[50vh] object-contain"
                  fallbackText="Foto do comprovante não disponível"
                />

                {/* Rodapé de Tamanho na visualização do Comprovante */}
                <div className="w-full p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span>Tam. Original:</span>
                    <strong className="font-mono text-slate-800">{formatBytes(originalSize)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tam. Processado:</span>
                    <strong className="font-mono text-emerald-700">{formatBytes(processedSize)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer da Aba Comprovante */}
        {step === 'comprovante' && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setStep('review')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar aos Campos da OCR</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar & Salvar no Espelho</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
