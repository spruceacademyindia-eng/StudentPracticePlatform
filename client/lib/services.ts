import api from './api';

// ── Models & Interfaces ──
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  lastLogin?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  parentCategory?: { _id: string; name: string } | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt?: string;
}

export interface TypingContent {
  _id: string;
  title: string;
  description?: string;
  content: string;
  category: { _id: string; name: string } | string;
  subcategory?: { _id: string; name: string } | string | null;
  wordCount: number;
  characterCount: number;
  mode: 'PRACTICE' | 'CHALLENGE' | 'BOTH';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  targetWPM: number;
  minimumAccuracy: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdBy?: { firstName: string; lastName: string };
  createdAt?: string;
}

export interface TypingAttempt {
  _id: string;
  student: { _id: string; firstName: string; lastName: string; email: string };
  content: { _id: string; title: string };
  mode: 'PRACTICE' | 'CHALLENGE';
  targetWPM: number;
  actualWPM: number;
  accuracy: number;
  typedCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  wordsTyped: number;
  timeTaken: number;
  result: 'PASS' | 'FAIL' | 'COMPLETED';
  startedAt: string;
  completedAt: string;
  contentSnapshot: {
    title: string;
    content: string;
    categoryName: string;
    subcategoryName: string;
    targetWPM: number;
    minimumAccuracy: number;
    wordCount: number;
  };
  createdAt: string;
}

export interface SystemSettings {
  defaultTargetWPM: number;
  minimumAccuracy: number;
  maximumWordCount: number;
  defaultChallengeDuration: number;
  availableWPMBenchmarks: number[];
  healthcareWordLimits?: { min: number; max: number };
  englishWordLimits?: { min: number; max: number };
  [key: string]: any;
}

// ── Auth Service ──
export const authService = {
  register: async (payload: { firstName: string; lastName: string; email: string; password: string; phone?: string }): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  adminLogin: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/admin-login', { email, password });
    return data;
  },

  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },

  saveSession: (token: string, user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('spruce_token', token);
      localStorage.setItem('spruce_user', JSON.stringify(user));
    }
  },

  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spruce_token');
      localStorage.removeItem('spruce_user');
    }
  },

  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('spruce_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('spruce_token');
  },
};

// ── Category Service ──
export const categoryService = {
  getAll: async (params?: { status?: string; parentOnly?: string; parentId?: string }) => {
    const { data } = await api.get('/categories', { params });
    return data as { success: boolean; count: number; categories: Category[] };
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/categories/${id}`);
    return data as { success: boolean; category: Category; subcategories: Category[] };
  },

  create: async (payload: { name: string; description?: string; parentCategory?: string | null }) => {
    const { data } = await api.post('/categories', payload);
    return data as { success: boolean; category: Category };
  },

  update: async (id: string, payload: Partial<Category>) => {
    const { data } = await api.put(`/categories/${id}`, payload);
    return data as { success: boolean; category: Category };
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    const { data } = await api.patch(`/categories/${id}/status`, { status });
    return data as { success: boolean; category: Category };
  },
};

// ── Content Service ──
export const contentService = {
  getAll: async (params?: {
    category?: string;
    subcategory?: string;
    mode?: string;
    difficulty?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/content', { params });
    return data as { success: boolean; total: number; page: number; pages: number; content: TypingContent[] };
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/content/${id}`);
    return data as { success: boolean; content: TypingContent };
  },

  create: async (payload: Partial<TypingContent>) => {
    const { data } = await api.post('/content', payload);
    return data as { success: boolean; content: TypingContent };
  },

  update: async (id: string, payload: Partial<TypingContent>) => {
    const { data } = await api.put(`/content/${id}`, payload);
    return data as { success: boolean; content: TypingContent };
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    const { data } = await api.patch(`/content/${id}/status`, { status });
    return data as { success: boolean; content: TypingContent };
  },
};

// ── Typing Session Service ──
export const typingService = {
  startSession: async (contentId: string, mode: 'PRACTICE' | 'CHALLENGE', targetWPM?: number) => {
    const { data } = await api.post('/typing/start', { contentId, mode, targetWPM });
    return data as {
      success: boolean;
      sessionToken: string;
      startedAt: string;
      timeLimitSeconds: number;
      targetWPM: number;
      minimumAccuracy: number;
    };
  },

  submitSession: async (sessionToken: string, typedText: string, timeTakenClient?: number) => {
    const { data } = await api.post('/typing/submit', { sessionToken, typedText, timeTakenClient });
    return data as {
      success: boolean;
      attempt: TypingAttempt;
      metrics: {
        wpm: number;
        accuracy: number;
        timeTaken: number;
        correctCharacters: number;
        incorrectCharacters: number;
        typedCharacters: number;
        wordsTyped: number;
        result: 'PASS' | 'FAIL' | 'COMPLETED';
        targetWPM: number;
        minimumAccuracy: number;
      };
    };
  },
};

// ── Attempt History Service ──
export const attemptService = {
  getMyAttempts: async (params?: { mode?: string; result?: string; sortBy?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/attempts/my', { params });
    return data as { success: boolean; total: number; page: number; pages: number; attempts: TypingAttempt[] };
  },

  getAllAdmin: async (params?: { studentId?: string; mode?: string; result?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/attempts/admin', { params });
    return data as { success: boolean; total: number; page: number; pages: number; attempts: TypingAttempt[] };
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/attempts/${id}`);
    return data as { success: boolean; attempt: TypingAttempt };
  },
};

// ── Analytics Service ──
export const analyticsService = {
  getStudentAnalytics: async () => {
    const { data } = await api.get('/analytics/student');
    return data as {
      success: boolean;
      summary: {
        totalAttempts: number;
        practiceAttempts: number;
        challengeAttempts: number;
        challengePassed: number;
        challengeFailed: number;
        bestWpm: number;
        avgWpm: number;
        bestAccuracy: number;
        avgAccuracy: number;
        passRate: number;
      };
      timeline: Array<{ session: string; date: string; wpm: number; accuracy: number; mode: string; result: string }>;
      categoryPerformance: Array<{ category: string; avgWpm: number; avgAccuracy: number; attempts: number }>;
      recentAttempts: TypingAttempt[];
    };
  },

  getAdminAnalytics: async () => {
    const { data } = await api.get('/analytics/admin');
    return data as {
      success: boolean;
      users: { total: number; active: number; inactive: number; blocked: number };
      summary: {
        totalAttempts: number;
        practiceAttempts: number;
        challengeAttempts: number;
        challengePassed: number;
        challengeFailed: number;
        avgWpm: number;
        bestWpm: number;
        avgAccuracy: number;
        passRate: number;
      };
      dailyAttempts: Array<{ date: string; attempts: number; avgWpm: number }>;
      leaderboard: Array<{ name: string; email: string; avgWpm: number; bestWpm: number; avgAccuracy: number; sessions: number }>;
      categoryStats: Array<{ name: string; count: number; avgWpm: number; avgAccuracy: number }>;
    };
  },
};

// ── Settings Service ──
export const settingsService = {
  getSettings: async () => {
    const { data } = await api.get('/settings');
    return data as { success: boolean; settings: SystemSettings };
  },

  updateSettings: async (payload: Partial<SystemSettings>) => {
    const { data } = await api.put('/settings', payload);
    return data as { success: boolean; settings: SystemSettings };
  },
};

// ── Reports Service ──
export const reportsService = {
  getStudentReport: async (format?: string) => {
    if (format === 'csv') {
      const res = await api.get('/reports/student?format=csv', { responseType: 'blob' });
      return res.data;
    }
    const { data } = await api.get('/reports/student');
    return data;
  },

  getCategoryReport: async (format?: string) => {
    if (format === 'csv') {
      const res = await api.get('/reports/category?format=csv', { responseType: 'blob' });
      return res.data;
    }
    const { data } = await api.get('/reports/category');
    return data;
  },

  getChallengeReport: async (format?: string) => {
    if (format === 'csv') {
      const res = await api.get('/reports/challenge?format=csv', { responseType: 'blob' });
      return res.data;
    }
    const { data } = await api.get('/reports/challenge');
    return data;
  },
};

// ── User Management (Admin) ──
export const userService = {
  getStudents: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/users', { params });
    return data as {
      success: boolean;
      total: number;
      page: number;
      pages: number;
      users: Array<User & { stats: { totalAttempts: number; bestWpm: number; avgWpm: number; avgAccuracy: number } }>;
    };
  },

  getStudentById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data as {
      success: boolean;
      user: User;
      performance: {
        totalAttempts: number;
        practiceAttempts: number;
        challengeAttempts: number;
        challengePassed: number;
        challengeFailed: number;
        bestWpm: number;
        avgWpm: number;
        avgAccuracy: number;
        passRate: number;
      };
      recentAttempts: TypingAttempt[];
    };
  },

  updateUser: async (id: string, payload: Partial<User>) => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data as { success: boolean; user: User };
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED') => {
    const { data } = await api.patch(`/users/${id}/status`, { status });
    return data as { success: boolean; user: User };
  },

  resetPassword: async (id: string, newPassword: string) => {
    const { data } = await api.post(`/users/${id}/reset-password`, { newPassword });
    return data as { success: boolean; message: string };
  },
};

// ── Admin Logs Service ──
export const adminLogService = {
  getLogs: async (params?: { action?: string; entity?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/admin-logs', { params });
    return data as { success: boolean; total: number; page: number; pages: number; logs: any[] };
  },
};
