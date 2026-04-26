import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const AUTH_PATHS = ['/auth/login', '/auth/register'];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl = String(err.config?.url || '');
      const isAuthRequest = AUTH_PATHS.some((path) => requestUrl.includes(path));
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

      // Keep login/register errors in-place so forms can show backend messages
      if (!isAuthRequest && !isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
