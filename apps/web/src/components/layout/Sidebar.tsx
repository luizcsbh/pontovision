import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Camera,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Clock,
  Sparkles,
  User,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Calendário de Ponto', path: '/calendar', icon: CalendarDays },
  { name: 'Captura & OCR', path: '/capture', icon: Camera, highlight: true },
  { name: 'Marcação Manual', path: '/entry/new', icon: PlusCircle },
  { name: 'Espelho Virtual', path: '/virtual-mirror', icon: FileSpreadsheet },
  { name: 'Relatórios & Exportação', path: '/reports', icon: FileText },
  { name: 'Minhas Jornadas & Perfil', path: '/profile', icon: User },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:block min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
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

      <div className="mt-8 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
        <p className="font-semibold text-slate-700 mb-1">OCR 100% Local</p>
        <p>
          Seus dados e imagens nunca são enviados para APIs externas de reconhecimento.
        </p>
      </div>
    </aside>
  );
};
