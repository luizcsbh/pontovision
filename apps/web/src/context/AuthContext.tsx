import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpfMasked?: string;
  role: string;
  timezone: string;
  preferences?: Record<string, any>;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; cpf?: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pontovision_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      if (!token) {
        setUser(null);
        return;
      }
      const data = await apiRequest<UserProfile>('/auth/profile');
      setUser(data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('pontovision_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const login = async (data: { email: string; password: string }) => {
    const res = await apiRequest<{ user: UserProfile; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    localStorage.setItem('pontovision_token', res.accessToken);
    localStorage.setItem('pontovision_refresh_token', res.refreshToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; password: string; cpf?: string }) => {
    const res = await apiRequest<{ user: UserProfile; accessToken: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    localStorage.setItem('pontovision_token', res.accessToken);
    localStorage.setItem('pontovision_refresh_token', res.refreshToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('pontovision_token');
    localStorage.removeItem('pontovision_refresh_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
