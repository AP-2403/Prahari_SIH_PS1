/**
 * API client — all calls go through /api (proxied to localhost:8000)
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prahari_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (guarded against interrupting demo tours)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isDemo =
        localStorage.getItem('prahari_token') === 'demo_admin_jwt_token_sih2026' ||
        localStorage.getItem('prahari_demo_active') === 'true';

      if (!isDemo && window.location.pathname !== '/login') {
        localStorage.removeItem('prahari_token');
        localStorage.removeItem('prahari_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Named helpers ─────────────────────────────────────────────────────
export const auth = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

export const works = {
  list: (params) => api.get('/works', { params }),
  get: (id) => api.get(`/works/${id}`),
  uploadPhoto: (id, file, claimed_pct, options = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('claimed_pct', claimed_pct);
    if (options.override_gps_lat != null) fd.append('override_gps_lat', options.override_gps_lat);
    if (options.override_gps_lng != null) fd.append('override_gps_lng', options.override_gps_lng);
    if (options.notes) fd.append('notes', options.notes);
    return api.post(`/works/${id}/progress-photo`, fd);
  },
};

export const dashboard = {
  get: (role, id) => api.get(`/dashboard/${role}`, { params: id ? { id } : {} }),
  getGeo: () => api.get('/dashboard/meta/geo'),
};

export const engines = {
  run: () => api.post('/engines/run'),
  status: (jobId) => api.get(`/engines/status/${jobId}`),
};

export const vendors = {
  graph: () => api.get('/vendors/graph'),
  clusters: () => api.get('/vendors/clusters'),
};

export const upload = {
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/admin/upload', fd);
  },
  confirm: (uploadId, columnMapping) =>
    api.post(`/admin/upload/${uploadId}/confirm`, columnMapping),
  status: (jobId) => api.get(`/admin/upload/${jobId}/status`),
};

export const assistant = {
  chat: (message, mp_scope_id, history) => api.post('/assistant/chat', { message, mp_scope_id, history }),
  query: (message, mp_scope_id) => api.post('/assistant/query', { message, mp_scope_id }),
};

export const feedback = {
  list: (min_risk) => api.get('/feedback', { params: { min_risk } }),
  submit: (work_id, verdict, note) => api.post('/feedback', { work_id, verdict, note }),
};

export const citizen = {
  getWork: (id) => api.get(`/citizen/work/${id}`),
};
