import axios from "axios";


// ── Base URL from Vite env variable ───────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL:         BASE_URL,
  timeout:         15000,           // 15 second timeout
  withCredentials: true,            // Send HTTP-only cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ════════════════════════════════════════════════════
//  REQUEST INTERCEPTOR
//  Inject Bearer token from localStorage as fallback
//  (for mobile clients or environments without cookie support)
// ════════════════════════════════════════════════════
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ════════════════════════════════════════════════════
//  RESPONSE INTERCEPTOR
//  Handle 401 globally — clear stale token & redirect
// ════════════════════════════════════════════════════
axiosInstance.interceptors.response.use(
  // ── Success: pass through ───────────────────────
  (response) => response,

  // ── Error: handle globally ──────────────────────
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message || '';

    // ── Session expired or invalid token ──────────
    if (status === 401) {
      localStorage.removeItem('token');

      // Only redirect if not already on /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // ── Forbidden — wrong role ─────────────────────
    if (status === 403) {
      console.warn('🚫 Forbidden:', message);
    }

    // ── Network error ──────────────────────────────
    if (!error.response) {
      console.error('🌐 Network Error: Could not reach the server.');
    }

    return Promise.reject(error);
  }
);



export default axiosInstance;
