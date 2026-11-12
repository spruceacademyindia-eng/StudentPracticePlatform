'use client';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('spruce_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intelligent 401 handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      localStorage.removeItem('spruce_token');
      localStorage.removeItem('spruce_user');

      // Do not redirect if already on login pages
      if (currentPath.includes('/login') || currentPath.includes('/register')) {
        return Promise.reject(err);
      }

      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
