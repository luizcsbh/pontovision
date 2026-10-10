import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useModalAlert } from '../components/common/ModalAlert';
import {
  User,
  Building2,
  Clock,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  Star,
  Copy,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  FileText,
} from 'lucide-react';
import {
  isValidCNPJ,
  formatCNPJ,
  normalizeCNPJ,
  formatCPF,
  isValidCPF,
  normalizeCPF,
  maskCPF,
} from '@pontovision/shared';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const DAY_NAMES = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

interface DayRule {
  dayOfWeek: number;
  isEnabled: boolean;
  plannedEntry: string;
  plannedBreakStart: string;
  plannedBreakEnd: string;
  plannedExit: string;
  expectedWorkMinutes: number;
}

interface ScheduleItem {
  _id: string;
  name: string;
  weeklyRules: DayRule[];
  effectiveFrom: string;
  toleranceMinutes: number;
  isDefault: boolean;
  createdAt?: string;
}

function timeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function calcWorkMinutes(rule: DayRule): number {
  const entry = timeToMinutes(rule.plannedEntry);
  const exit = timeToMinutes(rule.plannedExit);
  const bStart = timeToMinutes(rule.plannedBreakStart);
  const bEnd = timeToMinutes(rule.plannedBreakEnd);

  if (!entry || !exit || exit <= entry) return 0;
  const total = exit - entry;
  const breakMin = bEnd > bStart ? bEnd - bStart : 0;
  return Math.max(0, total - breakMin);
}

function fmtHours(mins: number): string {
  if (!mins) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function totalWeekMinutes(rules: DayRule[]): number {
  return rules
    .filter((r) => r.isEnabled)
    .reduce((acc, r) => acc + (r.expectedWorkMinutes || calcWorkMinutes(r)), 0);
}

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

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showAlert, showConfirm } = useModalAlert();
  const [activeTab, setActiveTab] = useState<'personal' | 'company' | 'schedules'>('personal');

  // Estado dos Dados Pessoais
  const [name, setName] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState(false);
  const [personalError, setPersonalError] = useState('');

  // Estado dos Dados da Empresa
  const [company, setCompany] = useState({
    razaoSocial: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    uf: 'SP',
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySuccess, setCompanySuccess] = useState(false);
  const [companyError, setCompanyError] = useState('');

  // Estado das Jornadas
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{
    name: string;
    toleranceMinutes: number;
    effectiveFrom: string;
    isDefault: boolean;
    weeklyRules: DayRule[];
  }>({
    name: '',
    toleranceMinutes: 10,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    isDefault: false,
    weeklyRules: defaultWeeklyRules(),
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleModalError, setScheduleModalError] = useState('');
  const [scheduleGlobalSuccess, setScheduleGlobalSuccess] = useState('');

  // Escala Padrão Ativa para o Resumo Semanal
  const activeSchedule = schedules.find((s) => s.isDefault) || schedules[0];
  const activeWeekMins = activeSchedule ? totalWeekMinutes(activeSchedule.weeklyRules || []) : 0;
  const activeWorkDaysCount = activeSchedule
    ? activeSchedule.weeklyRules?.filter((r) => r.isEnabled).length || 0
    : 0;

  // Carrega dados iniciais do usuário
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.company) {
        setCompany({
          razaoSocial: user.company.razaoSocial || '',
          cnpj: user.company.cnpj ? formatCNPJ(user.company.cnpj) : '',
          endereco: user.company.endereco || '',
          cidade: user.company.cidade || '',
          uf: user.company.uf || 'SP',
        });
      }
    }
  }, [user]);

  // Carrega jornadas
  const loadSchedules = useCallback(async () => {
    try {
      setLoadingSchedules(true);
      const data = await apiRequest<ScheduleItem[]>('/schedules');
      setSchedules(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar jornadas:', err);
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // 1. Salvar Dados Pessoais
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalError('');
    setPersonalSuccess(false);

    if (!name.trim()) {
      setPersonalError('O nome não pode ficar vazio.');
      return;
    }

    try {
      setSavingPersonal(true);
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim() }),
      });
      await refreshProfile();
      setPersonalSuccess(true);
      setTimeout(() => setPersonalSuccess(false), 3500);
    } catch (err: any) {
      setPersonalError(err.message || 'Falha ao atualizar dados pessoais.');
    } finally {
      setSavingPersonal(false);
    }
  };

  // 2. Salvar Dados da Empresa
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    setCompany((prev) => ({ ...prev, cnpj: formatCNPJ(raw) }));
    if (companyError) setCompanyError('');
  };

  const isCnpjValid = company.cnpj ? isValidCNPJ(company.cnpj) : null;

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySuccess(false);

    if (company.cnpj) {
      const clean = normalizeCNPJ(company.cnpj);
      if (clean && !isValidCNPJ(clean)) {
        setCompanyError('O CNPJ informado é inválido. Verifique os números digitados.');
        return;
      }
    }

    try {
      setSavingCompany(true);
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          company: {
            ...company,
            cnpj: company.cnpj ? normalizeCNPJ(company.cnpj) : '',
          },
        }),
      });
      await refreshProfile();
      setCompanySuccess(true);
      setTimeout(() => setCompanySuccess(false), 3500);
    } catch (err: any) {
      setCompanyError(err.message || 'Falha ao salvar dados da empresa.');
    } finally {
      setSavingCompany(false);
    }
  };

  // 3. Gestão de Jornadas
  const handleOpenNewSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      name: `Jornada ${schedules.length + 1}`,
      toleranceMinutes: 10,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      isDefault: schedules.length === 0,
      weeklyRules: defaultWeeklyRules(),
    });
    setScheduleModalError('');
    setScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (item: ScheduleItem) => {
    setEditingSchedule(item);
    const rules: DayRule[] = Array.from({ length: 7 }, (_, i) => {
      const found = item.weeklyRules?.find((r) => r.dayOfWeek === i);
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

    setScheduleForm({
      name: item.name,
      toleranceMinutes: item.toleranceMinutes || 10,
      effectiveFrom: item.effectiveFrom || new Date().toISOString().slice(0, 10),
      isDefault: item.isDefault,
      weeklyRules: rules,
    });
    setScheduleModalError('');
    setScheduleModalOpen(true);
  };

  const handleDayRuleChange = (dayIdx: number, updated: DayRule) => {
    setScheduleForm((prev) => {
      const rules = [...prev.weeklyRules];
      rules[dayIdx] = {
        ...updated,
        expectedWorkMinutes: calcWorkMinutes(updated),
      };
      return { ...prev, weeklyRules: rules };
    });
  };

  const handleReplicateMonday = () => {
    const mon = scheduleForm.weeklyRules[1];
    if (!mon.isEnabled) return;
    setScheduleForm((prev) => ({
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

  const handleSaveScheduleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleModalError('');

    if (!scheduleForm.name.trim()) {
      setScheduleModalError('Informe um nome para a jornada.');
      return;
    }

    const payload = {
      ...scheduleForm,
      weeklyRules: scheduleForm.weeklyRules.map((r) => ({
        ...r,
        expectedWorkMinutes: calcWorkMinutes(r),
      })),
    };

    try {
      setSavingSchedule(true);
      if (editingSchedule) {
        await apiRequest(`/schedules/${editingSchedule._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setScheduleGlobalSuccess('Jornada atualizada com sucesso!');
      } else {
        await apiRequest('/schedules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setScheduleGlobalSuccess('Nova jornada cadastrada com sucesso!');
      }
      setScheduleModalOpen(false);
      await loadSchedules();
      setTimeout(() => setScheduleGlobalSuccess(''), 3500);
    } catch (err: any) {
      setScheduleModalError(err.message || 'Falha ao salvar jornada.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSetDefault = async (scheduleId: string) => {
    try {
      await apiRequest(`/schedules/${scheduleId}/default`, { method: 'PATCH' });
      await loadSchedules();
      setScheduleGlobalSuccess('Jornada padrão alterada com sucesso!');
      setTimeout(() => setScheduleGlobalSuccess(''), 3500);
    } catch (err: any) {
      showAlert({
        title: 'Atenção',
        message: err.message || 'Falha ao definir jornada padrão.',
        type: 'warning',
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, name: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Jornada',
      message: `Deseja realmente excluir a jornada "${name}"? Esta ação não pode ser desfeita.`,
      type: 'danger',
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
    });
    if (!confirmed) {
      return;
    }
    try {
      await apiRequest(`/schedules/${scheduleId}`, { method: 'DELETE' });
      await loadSchedules();
      setScheduleGlobalSuccess('Jornada excluída com sucesso.');
      setTimeout(() => setScheduleGlobalSuccess(''), 3500);
    } catch (err: any) {
      showAlert({
        title: 'Erro ao Excluir',
        message: err.message || 'Não foi possível excluir a jornada.',
        type: 'danger',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Meu Perfil & Configurações</h1>
          <p className="text-sm text-slate-500">
            Gerencie seus dados cadastrais, dados da empresa empregadora e suas escalas de trabalho.
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 border-b border-slate-200 bg-white p-1.5 sm:p-2 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'personal'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados Pessoais</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'company'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresa & Local</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'schedules'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Jornadas ({schedules.length})</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 1: DADOS PESSOAIS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Identificação do Trabalhador</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Seu nome e identificador fiscal utilizados nos registros de ponto e comprovantes.
            </p>
          </div>

          {personalSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Dados pessoais atualizados com sucesso!</span>
            </div>
          )}

          {personalError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-red-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{personalError}</span>
            </div>
          )}

          <form onSubmit={handleSavePersonal} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* CPF BLOQUEADO */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>CPF do Titular</span>
                </label>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-[10px] font-bold">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>Dado oficial protegido (Não alterável)</span>
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user?.cpf ? formatCPF(user.cpf) : user?.cpfMasked || 'Não cadastrado'}
                  className="w-full max-w-sm px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 cursor-not-allowed"
                />
                <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validado pela CLT</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-start space-x-1.5">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  Por exigência da Portaria MTE nº 671/2021 e da legislação trabalhista, o CPF identifica univocamente
                  seus registros de ponto REP e seus comprovantes fiscais. Ele foi validado no momento da criação da conta
                  e permanece imutável por questões de integridade jurídica e auditoria.
                </span>
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPersonal}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{savingPersonal ? 'Salvando...' : 'Salvar Alterações Pessoais'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 2: LOCAL DE TRABALHO / EMPRESA */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Dados do Local de Trabalho & Empresa</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre as informações da empresa onde você trabalha. Esses dados são comparados com os comprovantes fiscais do REP.
            </p>
          </div>

          {companySuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Dados da empresa atualizados com sucesso!</span>
            </div>
          )}

          {companyError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-red-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{companyError}</span>
            </div>
          )}

          <form onSubmit={handleSaveCompany} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Razão Social */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social / Nome da Empresa
                </label>
                <input
                  type="text"
                  value={company.razaoSocial}
                  onChange={(e) => setCompany({ ...company, razaoSocial: e.target.value })}
                  placeholder="Ex: SOCIEDADE EDUCACIONAL PRE TECNICO LTDA"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* CNPJ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    CNPJ da Empresa
                  </label>
                  {company.cnpj && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCnpjValid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isCnpjValid ? 'CNPJ Válido' : 'CNPJ Inválido'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={company.cnpj}
                    onChange={handleCnpjChange}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 ${
                      company.cnpj && !isCnpjValid
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                        : company.cnpj && isCnpjValid
                        ? 'border-emerald-300 focus:ring-emerald-400 bg-emerald-50/20'
                        : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  {isCnpjValid && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Endereço (Rua, Número, Bairro)</span>
                </label>
                <input
                  type="text"
                  value={company.endereco}
                  onChange={(e) => setCompany({ ...company, endereco: e.target.value })}
                  placeholder="Ex: Rua Boaventura, 424 - Barreiro"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={company.cidade}
                  onChange={(e) => setCompany({ ...company, cidade: e.target.value })}
                  placeholder="Ex: Belo Horizonte"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* UF */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado (UF)
                </label>
                <select
                  value={company.uf}
                  onChange={(e) => setCompany({ ...company, uf: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {ESTADOS_BRASIL.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingCompany}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{savingCompany ? 'Salvando...' : 'Salvar Dados da Empresa'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 3: MINHAS JORNADAS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          {/* Card de Resumo Semanal da Escala Padrão */}
            {activeSchedule && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-white/20 rounded-full flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-white" />
                        <span>Resumo da Escala Ativa</span>
                      </span>
                      <span className="text-sm font-semibold opacity-90">{activeSchedule.name}</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black mt-2 font-mono">{fmtHours(activeWeekMins)}</p>
                    <p className="text-xs opacity-80 mt-0.5">
                      {activeWorkDaysCount} dias de trabalho/semana ·{' '}
                      {fmtHours(Math.round(activeWeekMins / (activeWorkDaysCount || 1)))} média/dia ·{' '}
                      Tolerância CLT: {activeSchedule.toleranceMinutes || 10} min
                    </p>
                  </div>

                  {/* Mini calendário visual por dia */}
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                    {DAY_NAMES.map((d, idx) => {
                      const r = activeSchedule.weeklyRules?.find((rule) => rule.dayOfWeek === idx);
                      const isEnabled = r?.isEnabled;
                      const mins = isEnabled ? calcWorkMinutes(r) : 0;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-0.5 sm:gap-1">
                          <span className="text-[9px] sm:text-[10px] opacity-70 font-medium">{d.slice(0, 3)}</span>
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                              isEnabled ? 'bg-white text-blue-700 shadow-sm' : 'bg-white/10 text-white/40'
                            }`}
                            title={isEnabled ? `${fmtHours(mins)} de trabalho (${r?.plannedEntry} - ${r?.plannedExit})` : 'Folga'}
                          >
                            {isEnabled ? fmtHours(mins) : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Indicador de conformidade CLT */}
                {activeWeekMins > 0 && (
                  <div className="flex items-center space-x-2 text-xs opacity-90 bg-white/10 rounded-xl p-3">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      Jornada CLT padrão: <strong>44h semanais</strong> (2.640 min).
                      Sua escala soma <strong>{fmtHours(activeWeekMins)}</strong>.
                      {activeWeekMins > 2640 && (
                        <span className="font-bold text-amber-200"> ⚠️ Excede o limite semanal CLT padrão.</span>
                      )}
                      {activeWeekMins === 2640 && (
                        <span className="font-bold text-emerald-200"> ✅ Carga horária semanal exatamente conforme Art. 58 da CLT.</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span>Minhas Jornadas de Trabalho</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Cadastre diferentes escalas de trabalho (ex: 44h semanais, 12x36, estágio 30h) e defina qual é a padrão ativa.
                  </p>
                </div>

                <button
                  onClick={handleOpenNewSchedule}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Jornada</span>
                </button>
              </div>

              {scheduleGlobalSuccess && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{scheduleGlobalSuccess}</span>
                </div>
              )}

            {/* Lista de Jornadas */}
            <div className="mt-6 space-y-4">
              {loadingSchedules ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Carregando jornadas...
                </div>
              ) : schedules.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Nenhuma jornada cadastrada</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Cadastre sua escala de trabalho contratual para cálculo de horas extras e faltas.
                  </p>
                  <button
                    onClick={handleOpenNewSchedule}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
                  >
                    Cadastrar Primeira Jornada
                  </button>
                </div>
              ) : (
                schedules.map((item) => {
                  const weekMins = totalWeekMinutes(item.weeklyRules || []);
                  return (
                    <div
                      key={item._id}
                      className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                        item.isDefault
                          ? 'border-blue-300 bg-blue-50/20 shadow-sm ring-1 ring-blue-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-slate-800 text-base">{item.name}</h3>
                            {item.isDefault ? (
                              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-white" />
                                <span>Padrão Ativa</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetDefault(item._id)}
                                className="text-xs text-slate-500 hover:text-blue-600 flex items-center space-x-1 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <Star className="w-3 h-3" />
                                <span>Tornar Padrão</span>
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-500">
                            Carga horária semanal:{' '}
                            <strong className="text-slate-700 font-mono">{fmtHours(weekMins)}</strong> · Tolerância CLT:{' '}
                            <strong className="text-slate-700">{item.toleranceMinutes || 10} min</strong> · Início:{' '}
                            <span className="font-mono">{item.effectiveFrom}</span>
                          </p>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEditSchedule(item)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center space-x-1.5 text-xs font-semibold"
                            title="Editar jornada"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSchedule(item._id, item.name)}
                            disabled={schedules.length <= 1}
                            className={`p-2 rounded-xl transition-colors flex items-center space-x-1.5 text-xs font-semibold ${
                              schedules.length <= 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              schedules.length <= 1
                                ? 'Não é possível excluir a única jornada'
                                : 'Excluir jornada'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>

                      {/* Mini resumo dos dias */}
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-7 gap-1 text-center">
                        {DAY_NAMES.map((d, idx) => {
                          const rule = item.weeklyRules?.find((r) => r.dayOfWeek === idx);
                          const isEnabled = rule?.isEnabled;
                          const mins = isEnabled ? calcWorkMinutes(rule) : 0;
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl text-xs flex flex-col justify-between ${
                                isEnabled
                                  ? 'bg-slate-100/80 text-slate-800 font-semibold'
                                  : 'bg-slate-50 text-slate-300'
                              }`}
                            >
                              <span className="text-[10px] text-slate-400 uppercase font-medium">
                                {d.slice(0, 3)}
                              </span>
                              <span className="mt-1 font-mono text-[11px]">
                                {isEnabled ? fmtHours(mins) : 'Folga'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: CADASTRO / EDIÇÃO DE JORNADA */}
      {/* ───────────────────────────────────────────────────────────── */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {editingSchedule ? 'Editar Jornada de Trabalho' : 'Cadastrar Nova Jornada'}
                </h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo Modal */}
            <form onSubmit={handleSaveScheduleModal} className="flex-1 overflow-y-auto p-6 space-y-5">
              {scheduleModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{scheduleModalError}</span>
                </div>
              )}

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Jornada
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder="Ex: Escala 44h Comercial"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tolerância CLT (minutos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={scheduleForm.toleranceMinutes}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        toleranceMinutes: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vigência a partir de
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.effectiveFrom}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, effectiveFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ações Rápidas de Horário */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Grade de Horários Diários
                </span>
                <button
                  type="button"
                  onClick={handleReplicateMonday}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Replicar Seg → Sex</span>
                </button>
              </div>

              {/* Escala dia a dia */}
              <div className="space-y-2.5">
                {scheduleForm.weeklyRules.map((rule, idx) => {
                  const workMins = rule.isEnabled ? calcWorkMinutes(rule) : 0;
                  return (
                    <div
                      key={rule.dayOfWeek}
                      className={`p-3.5 rounded-2xl border transition-colors ${
                        rule.isEnabled
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-slate-100/40 border-dashed border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 w-32">
                          <input
                            type="checkbox"
                            checked={rule.isEnabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              handleDayRuleChange(idx, {
                                ...rule,
                                isEnabled: enabled,
                                plannedEntry: enabled ? '08:00' : '',
                                plannedBreakStart: enabled ? '12:00' : '',
                                plannedBreakEnd: enabled ? '13:00' : '',
                                plannedExit: enabled ? '17:00' : '',
                                expectedWorkMinutes: enabled ? 480 : 0,
                              });
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-semibold text-xs text-slate-800">
                            {DAY_NAMES[rule.dayOfWeek]}
                          </span>
                        </div>

                        {rule.isEnabled ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs flex-1">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Entrada</span>
                              <input
                                type="time"
                                value={rule.plannedEntry}
                                onChange={(e) =>
                                  handleDayRuleChange(idx, { ...rule, plannedEntry: e.target.value })
                                }
                                className="px-2 py-1 font-mono border border-slate-300 rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block">Almoço Início</span>
                              <input
                                type="time"
                                value={rule.plannedBreakStart}
                                onChange={(e) =>
                                  handleDayRuleChange(idx, {
                                    ...rule,
                                    plannedBreakStart: e.target.value,
                                  })
                                }
                                className="px-2 py-1 font-mono border border-amber-300 bg-amber-50/30 rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block">Almoço Fim</span>
                              <input
                                type="time"
                                value={rule.plannedBreakEnd}
                                onChange={(e) =>
                                  handleDayRuleChange(idx, {
                                    ...rule,
                                    plannedBreakEnd: e.target.value,
                                  })
                                }
                                className="px-2 py-1 font-mono border border-amber-300 bg-amber-50/30 rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block">Saída</span>
                              <input
                                type="time"
                                value={rule.plannedExit}
                                onChange={(e) =>
                                  handleDayRuleChange(idx, { ...rule, plannedExit: e.target.value })
                                }
                                className="px-2 py-1 font-mono border border-slate-300 rounded-lg text-xs"
                              />
                            </div>

                            <div className="ml-auto text-right">
                              <span className="text-[10px] text-slate-400 block">Total</span>
                              <span className="font-mono font-bold text-blue-700 text-xs">
                                {fmtHours(workMins)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Folga / Dia Não Trabalhado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total da Semana no Modal */}
              <div className="p-4 bg-blue-50 rounded-2xl flex items-center justify-between text-xs text-blue-900">
                <span className="font-semibold">Carga Horária Semanal Total:</span>
                <span className="text-base font-black font-mono">
                  {fmtHours(totalWeekMinutes(scheduleForm.weeklyRules))}
                </span>
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSchedule ? 'Salvando...' : 'Salvar Jornada'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
