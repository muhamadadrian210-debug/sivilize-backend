import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'user' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  materialGrade?: 'A' | 'B' | 'C';
  type: 'rumah';
  roofModel?: '1-air' | '2-air' | '3-air' | '4-air' | 'dak';
  floors: number;
  dimensions: { length: number; width: number; height: number }[];
  versions: ProjectVersion[];
  dailyLogs: DailyLog[];
  status: 'draft' | 'ongoing' | 'completed';
  // Detail ruangan & bukaan
  bedroomCount?: number;
  bathroomCount?: number;
  doorCount?: number;
  windowCount?: number;
}

export interface ProjectVersion {
  id: string;
  versionNum: number;
  timestamp: number;
  rabItems: RABItem[];
  financialSettings: FinancialSettings;
  summary?: {
    subtotal: number;
    overheadAmount: number;
    profitAmount: number;
    contingencyAmount: number;
    taxAmount: number;
    grandTotal: number;
  };
}

export interface RABItem {
  id: string;
  category: 'Struktur' | 'Persiapan' | 'Tanah' | 'Dinding' | 'Lantai' | 'Finishing' | 'Atap' | 'Lain-lain';
  name: string;
  volume: number;
  unit: string;
  unitPrice: number;
  total: number;
  analysis?: AHSPAnalysis;
  // Tim kerja yang dialokasikan untuk pekerjaan ini
  assignedTeam?: {
    [key: string]: number; // e.g. { 'Pekerja': 4, 'Tukang Batu': 2 }
  };
}

export interface AHSPAnalysis {
  materials: { name: string; coeff: number; price: number; unit: string }[];
  labor: { name: string; coeff: number; wage: number; unit: string }[];
}

export interface FinancialSettings {
  overhead: number; // percentage
  profit: number; // percentage
  tax: number; // percentage
  contingency: number; // percentage
}

export interface DailyLog {
  id: string;
  date: string;
  text: string;
  photos: string[];
}

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  activeVersionId: string | null;
  userRole: UserRole;
  activeTab: string;
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setUserRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  setAuthenticated: (auth: boolean) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,
      activeVersionId: null,
      userRole: 'admin',
      activeTab: 'dashboard',
      user: null,
      isAuthenticated: !!localStorage.getItem('token'),

      setProjects: (projects) => set({ projects }),
      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setUserRole: (role) => set({ userRole: role }),
      setUser: (user) => set({ user, userRole: user?.role || 'user' }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      })),
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('sivilize_remember_me');
        set({ user: null, isAuthenticated: false, projects: [], activeProjectId: null });
      }
    }),
    {
      name: 'sivilize-hub-pro-storage',
    }
  )
);
