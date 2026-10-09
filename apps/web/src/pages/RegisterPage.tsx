import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Lock, Mail, User, Shield, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { isValidCPF, formatCPF, normalizeCPF } from '@pontovision/shared';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCpf(formatCPF(raw));
    if (errorMsg) setErrorMsg(null);
  };

  const isCpfValid = cpf.length > 0 ? isValidCPF(cpf) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCpf = normalizeCPF(cpf);
    if (!cleanCpf) {
      setErrorMsg('O CPF é obrigatório para criação de conta.');
      return;
    }

    if (!isValidCPF(cleanCpf)) {
      setErrorMsg('O CPF digitado não é válido. Verifique os dígitos informados.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, password, cpf: cleanCpf });
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao realizar cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md shadow-blue-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Criar Nova Conta</h1>
          <p className="text-xs text-slate-500">Comece a organizar suas marcações e espelhos de ponto hoje.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos da Silva"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>E-mail *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>CPF * (Obrigatório)</span>
              </label>
              <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Não poderá ser alterado
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 ${
                  isCpfValid === false
                    ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                    : isCpfValid === true
                    ? 'border-emerald-300 focus:ring-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {isCpfValid === true && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Utilizado para vincular seus comprovantes fiscais (REP) ao seu espelho.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Senha (mínimo 8 caracteres) *</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 mt-2 disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Cadastrando...' : 'Criar Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Já possui conta?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};
