import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Clock, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={sidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Alternar menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <div className="bg-blue-600 text-white p-2 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PontoVision AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                OCR Local
              </span>
            </div>
          </Link>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              title="Acessar Meu Perfil"
              className="text-right hidden sm:block hover:opacity-80 transition-opacity"
            >
              <div className="text-sm font-semibold text-slate-800 flex items-center justify-end space-x-1">
                <span>{user.name}</span>
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xs text-slate-500">{user.email} {user.cpfMasked && `• ${user.cpfMasked}`}</div>
            </Link>
            <button
              onClick={logout}
              title="Sair"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
