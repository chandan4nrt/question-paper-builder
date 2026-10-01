import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v3';

export const api = axios.create({ baseURL });

// Public client for anonymous, student-facing requests: does NOT attach the
// staff token and does NOT redirect to /login on 401, so students can reach
// the paper route untouched. The backend must allow these endpoints without
// authentication.
export const publicApi = axios.create({ baseURL });

const TOKEN_KEY = 'erp_staff_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data;
    return apiError?.message ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}