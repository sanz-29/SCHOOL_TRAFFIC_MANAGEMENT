/**
 * GateFlow AI Mock Authentication Service
 * All authentication logic is centralized here so it can be swapped for real
 * FastAPI endpoints (POST /auth/login, POST /auth/logout, GET /auth/me) in production.
 */

import { AuthUser, UserSession, UserRole } from '../types';

export const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  'principal@gateflow.demo': {
    password: 'Principal@123',
    user: {
      id: 'usr_principal_01',
      email: 'principal@gateflow.demo',
      name: 'Dr. Revathy Soundararajan',
      role: 'principal',
      title: 'School Principal',
      department: 'School Administration & Governance',
    },
  },
  'transport@gateflow.demo': {
    password: 'Transport@123',
    user: {
      id: 'usr_transport_01',
      email: 'transport@gateflow.demo',
      name: 'S. Ramanathan',
      role: 'transport_coordinator',
      title: 'Transport Coordinator',
      department: 'Operations, Logistics & Fleet',
    },
  },
  'gate@gateflow.demo': {
    password: 'Gate@123',
    user: {
      id: 'usr_gate_01',
      email: 'gate@gateflow.demo',
      name: 'M. Selvam',
      role: 'gate_staff',
      title: 'Senior Gate Marshal',
      department: 'Campus Security & Gate Operations',
    },
  },
};

const SESSION_STORAGE_KEY = 'gateflow_auth_session';
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

// Simulated network latency
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Authenticate user with credentials
   * (Equivalent to POST /auth/login)
   */
  async login(credentials: LoginCredentials): Promise<UserSession> {
    await delay();

    const normalizedEmail = credentials.email.trim().toLowerCase();
    const entry = MOCK_USERS[normalizedEmail];

    if (!entry || entry.password !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    const session: UserSession = {
      user: { ...entry.user },
      token: `gfk_tok_${btoa(entry.user.id + ':' + Date.now())}`,
      expiresAt: Date.now() + INACTIVITY_TIMEOUT_MS,
    };

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Session storage write failed:', e);
    }

    return session;
  },

  /**
   * Terminate active user session
   * (Equivalent to POST /auth/logout)
   */
  async logout(): Promise<void> {
    await delay(100);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('Session storage clear failed:', e);
    }
  },

  /**
   * Retrieve active session from storage, verifying validity & expiry
   * (Equivalent to GET /auth/me)
   */
  getSession(): UserSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;

      const session: UserSession = JSON.parse(raw);
      if (!session || !session.expiresAt || !session.user) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      // Check if expired
      if (Date.now() > session.expiresAt) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  },

  /**
   * Refresh activity timestamp on user interaction (extends session by 30 mins)
   */
  touchSession(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;

      const session: UserSession = JSON.parse(raw);
      session.expiresAt = Date.now() + INACTIVITY_TIMEOUT_MS;
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    const session = this.getSession();
    return session ? session.user : null;
  },
};
