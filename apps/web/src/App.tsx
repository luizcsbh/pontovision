import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ModalAlertProvider } from './components/common/ModalAlert';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { CapturePage } from './pages/CapturePage';
import { ManualEntryPage } from './pages/ManualEntryPage';
import { VirtualMirrorPage } from './pages/VirtualMirrorPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalAlertProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/capture" element={<CapturePage />} />
                <Route path="/entry/new" element={<ManualEntryPage />} />
                <Route path="/virtual-mirror" element={<VirtualMirrorPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/schedules" element={<Navigate to="/profile" replace />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ModalAlertProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
