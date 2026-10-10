import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';

export type ModalAlertType = 'danger' | 'warning' | 'info' | 'success';

export interface AlertOptions {
  title: string;
  message: string | React.ReactNode;
  type?: ModalAlertType;
  confirmText?: string;
}

export interface ConfirmOptions extends AlertOptions {
  cancelText?: string;
  isDestructive?: boolean;
}

interface ModalAlertState {
  isOpen: boolean;
  isConfirm: boolean;
  title: string;
  message: string | React.ReactNode;
  type: ModalAlertType;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  resolve?: (value: any) => void;
}

interface ModalAlertContextValue {
  showAlert: (options: AlertOptions) => Promise<void>;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeAlert: () => void;
}

const ModalAlertContext = createContext<ModalAlertContextValue | null>(null);

export const ModalAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalAlertState>({
    isOpen: false,
    isConfirm: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancelar',
    isDestructive: false,
  });

  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        isConfirm: false,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        confirmText: options.confirmText || 'Entendi',
        cancelText: '',
        isDestructive: false,
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        isConfirm: true,
        title: options.title,
        message: options.message,
        type: options.type || (options.isDestructive ? 'danger' : 'info'),
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        isDestructive: options.isDestructive || options.type === 'danger',
        resolve: (val: boolean) => resolve(val),
      });
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, [modalState]);

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Suporte a teclado: Esc fecha/cancela, Enter confirma
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen, modalState.resolve]);

  // Ícone por tipo
  const renderIcon = () => {
    switch (modalState.type) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-500/10">
            {modalState.isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/10">
            <AlertCircle className="w-6 h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/10">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (modalState.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20';
    }
  };

  return (
    <ModalAlertContext.Provider value={{ showAlert, showConfirm, closeAlert }}>
      {children}

      {modalState.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all p-5 sm:p-6 space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                {renderIcon()}
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-snug">{modalState.title}</h3>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-1 whitespace-pre-line">
              {modalState.message}
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-2.5">
              {modalState.isConfirm && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-center ${getConfirmButtonClasses()}`}
                autoFocus
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalAlertContext.Provider>
  );
};

export const useModalAlert = () => {
  const context = useContext(ModalAlertContext);
  if (!context) {
    throw new Error('useModalAlert must be used within a ModalAlertProvider');
  }
  return context;
};
