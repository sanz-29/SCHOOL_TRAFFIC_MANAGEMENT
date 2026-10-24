import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthUser, UserRole } from '../types';
import { authService, LoginCredentials } from './authService';
import { can as canCheck, AuthAction, getRoleLandingPage } from './permissions';
import { useAppStore } from '../store/useAppStore';

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionTimeoutMessage: string | null;
  clearSessionTimeoutMessage: () => void;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: (reason?: string) => Promise<void>;
  can: (action: AuthAction) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeoutMessage, setSessionTimeoutMessage] = useState<string | null>(null);
  const { setUserRole } = useAppStore();
  const lastTouchRef = useRef<number>(Date.now());

  // Restore session from sessionStorage on initial load
  useEffect(() => {
    try {
      const session = authService.getSession();
      if (session) {
        setUser(session.user);
        setUserRole(session.user.role);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setUserRole]);

  const logout = useCallback(async (reason?: string) => {
    await authService.logout();
    setUser(null);
    if (reason) {
      setSessionTimeoutMessage(reason);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    setSessionTimeoutMessage(null);
    const session = await authService.login(credentials);
    setUser(session.user);
    setUserRole(session.user.role);
    lastTouchRef.current = Date.now();
    return session.user;
  }, [setUserRole]);

  // Inactivity timeout watcher (30 minutes)
  useEffect(() => {
    if (!user) return;

    // Check expiry every 10 seconds
    const interval = setInterval(() => {
      const session = authService.getSession();
      if (!session) {
        logout('You were automatically signed out after 30 minutes of inactivity.');
      }
    }, 10000);

    // Activity listener (throttled to update session every 30 seconds)
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastTouchRef.current > 30000) {
        lastTouchRef.current = now;
        authService.touchSession();
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [user, logout]);

  const can = useCallback((action: AuthAction): boolean => {
    return canCheck(user?.role, action);
  }, [user?.role]);

  const clearSessionTimeoutMessage = useCallback(() => {
    setSessionTimeoutMessage(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        isLoading,
        sessionTimeoutMessage,
        clearSessionTimeoutMessage,
        login,
        logout,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
