import axios from 'axios';

// Dynamically determine API base URL for Local and Production (Vercel -> Render)
const rawBaseURL = import.meta.env.VITE_API_URL;
const baseURL = rawBaseURL
  ? (rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL.replace(/\/+$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not already on auth page, dispatch event
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
