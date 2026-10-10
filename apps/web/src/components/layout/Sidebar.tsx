import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Camera,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Sparkles,
  User,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Calendário de Ponto', path: '/calendar', icon: CalendarDays },
  { name: 'Fotografar', path: '/capture', icon: Camera, highlight: true },
  { name: 'Marcação Manual', path: '/entry/new', icon: PlusCircle },
  { name: 'Espelho Virtual', path: '/virtual-mirror', icon: FileSpreadsheet },
  { name: 'Relatórios & Exportação', path: '/reports', icon: FileText },
  { name: 'Minhas Jornadas & Perfil', path: '/profile', icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container positioned flush to the left */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1 pr-1">
          <div className="flex items-center justify-between md:hidden mb-4 pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu de Navegação
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Fechar menu"
              aria-label="Fechar menu lateral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : item.highlight
                        ? 'text-blue-600 bg-blue-50/70 hover:bg-blue-100/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                  {item.highlight && (
                    <Sparkles className="w-4 h-4 ml-auto text-amber-500 fill-amber-400" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">OCR 100% Local</p>
            <p>
              Seus dados e imagens nunca são enviados para APIs externas de reconhecimento.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
