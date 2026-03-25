/**
 * api-client.ts — HTTP client สำหรับเรียก API Gateway
 * BASE_URL ตั้งผ่าน EXPO_PUBLIC_API_URL ใน .env
 */
import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileApi = {
  get: (userId: string) => request(`/api/profile/${userId}`),
  update: (userId: string, data: object) =>
    request(`/api/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getPreferences: (userId: string) => request(`/api/profile/${userId}/preferences`),
  updatePreferences: (userId: string, data: object) =>
    request(`/api/profile/${userId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Meals ────────────────────────────────────────────────────────────────────

export const mealsApi = {
  getAll: (category?: string) =>
    request(`/api/meals/${category ? `?category=${category}` : ''}`),
  getById: (id: string) => request(`/api/meals/${id}`),
};

// ─── Planner (AI) ─────────────────────────────────────────────────────────────

export const plannerApi = {
  generate: (params: {
    goal: string;
    budget_per_week: number;
    target_calories: number;
    diet_tags?: string[];
    days?: number;
  }) =>
    request('/api/planner/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  swapMeal: (params: {
    current_meal: string;
    meal_type: string;
    diet_tags?: string[];
    budget?: number;
  }) =>
    request('/api/planner/swap', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  send: (token: string, title: string, body: string, data?: object) =>
    request('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ token, title, body, data }),
    }),
};
