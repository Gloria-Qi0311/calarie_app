const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

function headers(userId: string) {
  return {
    'Content-Type': 'application/json',
    'x-calorie-app-user-id': userId,
  };
}

async function request<T>(path: string, userId: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers(userId), ...(init.headers as Record<string, string> || {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null as T;
  return res.json();
}

export interface Profile {
  name: string;
  dailyCalorieTarget: number;
  age: number;
  sex: string;
  currentWeightKg: number;
  goalWeightKg: number;
  goalDirection: string;
  timezone: string;
}

export interface IntakeEntry {
  id: string;
  description: string;
  calories: number;
  consumedAt: string;
  mealTag?: string;
}

export interface TodayResponse {
  summary: {
    consumedCalories: number;
    remainingCalories: number;
    goalCalories: number;
    date: string;
  };
  intakeEntries: IntakeEntry[];
  profile: Profile;
}

export interface HistorySummary {
  date: string;
  consumedCalories: number;
  goalCalories: number;
}

export const api = {
  getProfile: (userId: string) =>
    request<{ profile: Profile }>('/api/profile', userId),

  updateProfile: (userId: string, data: Partial<Profile>) =>
    request<{ profile: Profile }>('/api/profile', userId, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getToday: (userId: string) =>
    request<TodayResponse>('/api/today', userId),

  getHistory: (userId: string, days = 7) =>
    request<{ summaries: HistorySummary[] }>(`/api/history?days=${days}`, userId),

  createIntake: (userId: string, data: { description: string; calories: number; mealTag?: string }) =>
    request<{ entry: IntakeEntry }>('/api/intake', userId, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteIntake: (userId: string, entryId: string) =>
    request<null>(`/api/intake/${entryId}`, userId, { method: 'DELETE' }),
};
