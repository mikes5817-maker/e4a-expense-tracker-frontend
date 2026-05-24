import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { User } from '../types';
import { loginApi, signupApi, getMeApi, logoutAction } from '../services/auth.service';
import { setLogoutCallback } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
  }, []);

  useEffect(() => {
    setLogoutCallback(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const me = await getMeApi();
        if (mounted && me?.id) setUser(me);
      } catch {
        // not authenticated
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    bootstrap();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setUser(res?.user ?? null);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const res = await signupApi(email, password, name);
    setUser(res?.user ?? null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user?.id, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
