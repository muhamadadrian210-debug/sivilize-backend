import axios from 'axios';
import type { Project, User } from '../store/useStore';

// Backend API URL - baca dari env variable, fallback ke URL production
const API_URL = import.meta.env.VITE_API_URL || 'https://server-1rimpvmey-muhamadadrian210-2602s-projects.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

type ApiResponse<T> = {
  success: boolean;
  data: T;
  token?: string;
  message?: string;
};

type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

type CreateProjectPayload = Omit<Partial<Project>, 'versions'> & {
  versions?: unknown[];
};

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<ApiResponse<User>>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  register: async (userData: RegisterPayload) => {
    const response = await api.post<ApiResponse<User>>('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
  updateProfile: async (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse<{ resetToken?: string; resetUrl?: string }>>('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post<ApiResponse<User>>('/auth/reset-password', { token, newPassword });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
};

export const projectService = {
  getProjects: async () => {
    const response = await api.get<ApiResponse<Project[]>>('/projects');
    return response.data;
  },
  getProject: async (id: string) => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data;
  },
  createProject: async (projectData: CreateProjectPayload) => {
    const response = await api.post<ApiResponse<Project>>('/projects', projectData);
    return response.data;
  },
  updateProject: async (id: string, projectData: Partial<Project>) => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, projectData);
    return response.data;
  },
  deleteProject: async (id: string) => {
    const response = await api.delete<ApiResponse<unknown>>(`/projects/${id}`);
    return response.data;
  },
  addVersion: async (projectId: string, versionData: unknown) => {
    const response = await api.post<ApiResponse<Project>>(`/projects/${projectId}/versions`, versionData);
    return response.data;
  },
};

export const ahspService = {
  getAHSPs: async () => {
    const response = await api.get<ApiResponse<unknown[]>>('/ahsp');
    return response.data;
  },
  createAHSP: async (ahspData: unknown) => {
    const response = await api.post<ApiResponse<unknown>>('/ahsp', ahspData);
    return response.data;
  },
};

export const materialService = {
  getMaterials: async () => {
    const response = await api.get<ApiResponse<unknown[]>>('/materials');
    return response.data;
  },
};

export const logService = {
  getLogs: async (projectId: string) => {
    const response = await api.get<ApiResponse<unknown[]>>(`/logs/${projectId}`);
    return response.data;
  },
  createLog: async (logData: FormData) => {
    const response = await api.post<ApiResponse<unknown>>('/logs', logData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const calculationService = {
  calculateRAB: async (calcData: unknown) => {
    const response = await api.post<ApiResponse<unknown>>('/calculate-rab', calcData);
    return response.data;
  },
};

export default api;
