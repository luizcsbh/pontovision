import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex-1 flex w-full relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main
          className={`flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'md:ml-64' : 'ml-0'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
