import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sprint_society_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Unwrap envelope: if response has { data: ... } at top level, return the inner data
    if (response.data && typeof response.data === 'object' && 'data' in response.data && !('error' in response.data)) {
      response.data = response.data.data;
    }
    return response;
  },
  (error: AxiosError<{ error?: { code?: string; message?: string } | string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sprint_society_token');
      window.dispatchEvent(new CustomEvent('sprint:session-expired'));
    }

    // Server errors come back as either { error: { code, message } } or a plain
    // { error: "string" } (older routes). Normalize both so the real reason reaches the UI.
    const rawErr = error.response?.data?.error;
    const apiErr = typeof rawErr === 'string' ? { code: undefined, message: rawErr } : rawErr;
    const status = error.response?.status || 0;
    const code = apiErr?.code || `HTTP_${status}`;
    const message = apiErr?.message || 'Something went wrong. Please try again.';

    // Dispatch global error event for toast
    window.dispatchEvent(new CustomEvent('sprint:api-error', { detail: { code, message, status } }));

    return Promise.reject(new ApiError(code, message, status));
  }
);

export default api;
