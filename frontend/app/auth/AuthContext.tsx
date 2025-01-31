'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setAuth({
        isAuthenticated: true,
        token,
        user: JSON.parse(user),
      });
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setAuth(prev => ({
      ...prev,
      isAuthenticated: true,
      token,
    }));
  };

  const logout = async () => {
    try {
      const formData = new FormData();
      formData.append('token', auth.token || '');
      
      await fetch('http://localhost:8000/signout/', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Error during signout:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({
      isAuthenticated: false,
      token: null,
      user: null,
    });
  };

  const setUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setAuth(prev => ({
      ...prev,
      user,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}