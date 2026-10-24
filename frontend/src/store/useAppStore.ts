import { create } from 'zustand';
import { UserRole, SimulationEngine } from '../types';

interface NotificationState {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface AppState {
  // Current logged in demo role
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Active workflow step in top stepper (1 to 10)
  currentStep: number;
  setStep: (step: number) => void;

  // Selected schedule & engine
  selectedScheduleId: string;
  setSelectedScheduleId: (id: string) => void;
  selectedEngine: SimulationEngine;
  setSelectedEngine: (engine: SimulationEngine) => void;

  // Simulation run metadata
  scenarioSeed: number;
  modelVersion: string;

  // Demo mode preloader state
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;

  // Global notification banner
  notification: NotificationState | null;
  setNotification: (notif: NotificationState | null) => void;
  clearNotification: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userRole: 'principal',
  setUserRole: (role) => set({ userRole: role }),

  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),

  selectedScheduleId: 'cand_balanced',
  setSelectedScheduleId: (id) => set({ selectedScheduleId: id }),

  selectedEngine: 'SUMO',
  setSelectedEngine: (engine) => set({ selectedEngine: engine }),

  scenarioSeed: 48291,
  modelVersion: 'SUMO-v1.18-SchoolGate',

  isDemoMode: true,
  setDemoMode: (enabled) => set({ isDemoMode: enabled }),

  notification: null,
  setNotification: (notif) => set({ notification: notif }),
  clearNotification: () => set({ notification: null }),
}));
