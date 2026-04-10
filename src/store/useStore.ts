import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'estimator' | 'owner' | 'user' | 'client';

// RBAC permissions map
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin:     ['read', 'write', 'delete', 'manage_users', 'export', 'audit'],
  estimator: ['read', 'write', 'export'],
  owner:     ['read', 'export'],
  user:      ['read', 'write', 'export'],
  client:    ['read'],
};

export const hasPermission = (role: UserRole, permission: string): boolean =>
  ROLE_PERMISSIONS[role]?.includes(permission) ?? false;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout';
  entity: 'project' | 'rab_item' | 'daily_log' | 'user' | 'version';
  entityId: string;
  entityName: string;
  oldValue?: unknown;
  newValue?: unknown;
  description: string;
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
  bedroomCount?: number;
  bathroomCount?: number;
  doorCount?: number;
  windowCount?: number;
  waterPointCount?: number;
  drainPointCount?: number;
  drinkingPointCount?: number;
  lightPointCount?: number;
  socketPointCount?: number;
  toiletType?: 'duduk' | 'jongkok';
  // Jenis tanah & pondasi
  soilType?: 'keras' | 'sedang' | 'lunak' | 'gambut' | 'pasir' | 'berbatu';
  foundationType?: 'batu-kali' | 'footplate' | 'tiang-pancang' | 'strauss-pile' | 'raft' | 'sumuran';
  // Tipe lokasi untuk multiplier ongkos angkut
  locationType?: 'kota' | 'pinggiran' | 'pelosok' | 'sangat-terpencil';
  // Auto-save draft
  autoSaveDraft?: Partial<ProjectVersion>;
  autoSavedAt?: number;
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
  category: 'Struktur' | 'Persiapan' | 'Tanah' | 'Dinding' | 'Lantai' | 'Finishing' | 'Atap' | 'Arsitektur' | 'Mekanikal' | 'Elektrikal' | 'Sanitasi' | 'Lain-lain';
  name: string;
  volume: number;
  unit: string;
  unitPrice: number;
  total: number;
  analysis?: AHSPAnalysis;
  assignedTeam?: { [key: string]: number };
  // AHSP validation
  ahspWarning?: string;
}

export interface AHSPAnalysis {
  materials: { name: string; coeff: number; price: number; unit: string }[];
  labor: { name: string; coeff: number; wage: number; unit: string }[];
}

export interface FinancialSettings {
  overhead: number;
  profit: number;
  tax: number;
  contingency: number;
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
  activityLogs: ActivityLog[];

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
  // Activity log
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearActivityLogs: () => void;
  // Auto-save
  saveAutoSaveDraft: (projectId: string, draft: Partial<ProjectVersion>) => void;
  clearAutoSaveDraft: (projectId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      activeVersionId: null,
      userRole: 'admin',
      activeTab: 'dashboard',
      user: null,
      isAuthenticated: false,
      activityLogs: [],

      setProjects: (projects) => set({ projects }),
      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setUserRole: (role) => set({ userRole: role }),
      setUser: (user) => set({ user, userRole: user?.role || 'user' }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      addProject: (project) => {
        set((state) => ({ projects: [...state.projects, project] }));
        const { user } = get();
        get().addActivityLog({
          userId: user?.id || 'unknown',
          userName: user?.name || 'Unknown',
          action: 'create',
          entity: 'project',
          entityId: project.id,
          entityName: project.name,
          newValue: { name: project.name, location: project.location },
          description: `Membuat proyek baru: ${project.name}`,
        });
      },

      updateProject: (id, updates) => {
        const oldProject = get().projects.find(p => p.id === id);
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
        const { user } = get();
        if (oldProject && updates.name !== undefined) {
          get().addActivityLog({
            userId: user?.id || 'unknown',
            userName: user?.name || 'Unknown',
            action: 'update',
            entity: 'project',
            entityId: id,
            entityName: updates.name || oldProject.name,
            oldValue: { name: oldProject.name, status: oldProject.status },
            newValue: { name: updates.name, status: updates.status },
            description: `Mengupdate proyek: ${oldProject.name}`,
          });
        }
      },

      deleteProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
        const { user } = get();
        if (project) {
          get().addActivityLog({
            userId: user?.id || 'unknown',
            userName: user?.name || 'Unknown',
            action: 'delete',
            entity: 'project',
            entityId: id,
            entityName: project.name,
            oldValue: { name: project.name },
            description: `Menghapus proyek: ${project.name}`,
          });
        }
      },

      logout: () => {
        const { user } = get();
        get().addActivityLog({
          userId: user?.id || 'unknown',
          userName: user?.name || 'Unknown',
          action: 'logout',
          entity: 'user',
          entityId: user?.id || 'unknown',
          entityName: user?.name || 'Unknown',
          description: `User logout: ${user?.name}`,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('sivilize_remember_me');
        set({ user: null, isAuthenticated: false, projects: [], activeProjectId: null });
      },

      addActivityLog: (log) => {
        const newLog: ActivityLog = {
          ...log,
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          // Keep max 500 logs
          activityLogs: [newLog, ...state.activityLogs].slice(0, 500),
        }));
      },

      clearActivityLogs: () => set({ activityLogs: [] }),

      saveAutoSaveDraft: (projectId, draft) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, autoSaveDraft: draft, autoSavedAt: Date.now() }
              : p
          ),
        }));
      },

      clearAutoSaveDraft: (projectId) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, autoSaveDraft: undefined, autoSavedAt: undefined }
              : p
          ),
        }));
      },
    }),
    {
      name: 'sivilize-hub-pro-storage',
    }
  )
);
