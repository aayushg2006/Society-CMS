import axios from 'axios';
import { ApiResponse, Page, Notification } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    societyCode: string;
    flatId?: number;
    phoneNumber?: string;
    role?: string;
  }) => api.post('/auth/register', data),
  registerSociety: (data: any) => api.post('/auth/register-society', data),
  verifyEmail: (token: string) =>
    api.get(`/auth/verify?token=${token}`),
};

// Complaint APIs
export const complaintApi = {
  getAll: (params?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortDir?: string;
  }) => api.get('/complaints', { params }),
  getMy: (page = 0, size = 10) =>
    api.get('/complaints/my', { params: { page, size } }),
  getById: (id: number) => api.get(`/complaints/${id}`),
  checkDuplicate: (category: string, scope: string, commonAreaId?: number) => 
    api.get('/complaints/check-duplicate', { params: { category, scope, commonAreaId } }),
  create: (data: any) => api.post('/complaints', data),
  updateStatus: (id: number, data: { status: string; comment?: string }) =>
    api.put(`/complaints/${id}/status`, data),
  assignStaff: (id: number, data: { staffId: number; expectedCompletionDate?: string; comment?: string }) =>
    api.put(`/complaints/${id}/assign`, data),
  upvote: (id: number) => api.post(`/complaints/${id}/upvote`),
  toggleFollow: (id: number) => api.post(`/complaints/${id}/follow`),
  getActivityLogs: (id: number) => api.get(`/complaints/${id}/activity`),
};

// Society APIs
export const societyApi = {
  getDashboard: () => api.get('/dashboard'),
  getBuildings: () => api.get('/buildings'),
  createBuilding: (data: any) => api.post('/buildings', data),
  getFlats: (buildingId?: number) =>
    api.get('/flats', { params: buildingId ? { buildingId } : {} }),
  createFlat: (data: any) => api.post('/flats', data),
  getCommonAreas: () => api.get('/common-areas'),
  createCommonArea: (data: any) => api.post('/common-areas', data),
  getUsers: () => api.get('/users'),
  createUser: (data: any) => api.post('/users', data),
  bulkUploadUsers: (data: FormData) => api.post('/users/bulk-upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data: any) => api.put('/users/change-password', data),
  getStaff: () => api.get('/users/staff'),
  updateUserRole: (id: number, role: string) =>
    api.put(`/users/${id}/role`, { role }),
  toggleUserActive: (id: number) => api.put(`/users/${id}/toggle-active`),
  verifyUser: (id: number) => api.put(`/users/${id}/verify`),
  verifyGeoFence: (data: { latitude: number; longitude: number }) =>
    api.post('/geo-fence/verify', data),
};

// File Upload API
export const fileApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ url: string }>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const notificationApi = {
  getAll: (params?: { page?: number; size?: number }) => api.get<ApiResponse<Page<Notification>>>('/notifications', { params }),
  getUnreadCount: () => api.get<ApiResponse<number>>('/notifications/unread-count'),
  markAsRead: (id: number) => api.put<ApiResponse<void>>(`/notifications/${id}/read`),
};
