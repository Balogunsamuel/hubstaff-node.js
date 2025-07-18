import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hubstaff_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hubstaff_token');
      localStorage.removeItem('hubstaff_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  getCurrentUser: () => apiClient.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => apiClient.get('/users', { params }),
  getUser: (userId) => apiClient.get(`/users/${userId}`),
  updateUser: (userId, userData) => apiClient.put(`/users/${userId}`, userData),
  updateCurrentUser: (userData) => apiClient.put('/users/me', userData),
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),
  getTeamStats: () => apiClient.get('/users/team/stats'),
};

// Projects API
export const projectsAPI = {
  getProjects: (params = {}) => apiClient.get('/projects', { params }),
  getProject: (projectId) => apiClient.get(`/projects/${projectId}`),
  createProject: (projectData) => apiClient.post('/projects', projectData),
  updateProject: (projectId, projectData) => apiClient.put(`/projects/${projectId}`, projectData),
  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),
  getProjectTasks: (projectId) => apiClient.get(`/projects/${projectId}/tasks`),
  createTask: (projectId, taskData) => apiClient.post(`/projects/${projectId}/tasks`, taskData),
  getProjectStats: () => apiClient.get('/projects/stats/dashboard'),
};

// Time Tracking API
export const timeTrackingAPI = {
  startTracking: (data) => apiClient.post('/time-tracking/start', data),
  stopTracking: (entryId) => apiClient.post(`/time-tracking/stop/${entryId}`),
  getActiveEntry: () => apiClient.get('/time-tracking/active'),
  getTimeEntries: (params = {}) => apiClient.get('/time-tracking/entries', { params }),
  createManualEntry: (data) => apiClient.post('/time-tracking/manual', data),
  updateTimeEntry: (entryId, data) => apiClient.put(`/time-tracking/entries/${entryId}`, data),
  recordActivity: (data) => apiClient.post('/time-tracking/activity', data),
  uploadScreenshot: (entryId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/time-tracking/screenshot?time_entry_id=${entryId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getDailyReport: (date) => apiClient.get('/time-tracking/reports/daily', { params: { date } }),
  getTeamTimeReport: (startDate, endDate) => apiClient.get('/time-tracking/reports/team', { 
    params: { start_date: startDate, end_date: endDate } 
  }),
};

// Analytics API
export const analyticsAPI = {
  getDashboardAnalytics: () => apiClient.get('/analytics/dashboard'),
  getTeamAnalytics: (startDate, endDate) => apiClient.get('/analytics/team', {
    params: { start_date: startDate, end_date: endDate }
  }),
  getProductivityAnalytics: (period = 'week') => apiClient.get('/analytics/productivity', {
    params: { period }
  }),
  generateCustomReport: (params) => apiClient.get('/analytics/reports/custom', { params }),
};

// Integrations API
export const integrationsAPI = {
  getIntegrations: () => apiClient.get('/integrations'),
  connectSlack: (webhookUrl) => apiClient.post('/integrations/slack/connect', { webhook_url: webhookUrl }),
  connectTrello: (apiKey, token) => apiClient.post('/integrations/trello/connect', { api_key: apiKey, token }),
  connectGitHub: (token) => apiClient.post('/integrations/github/connect', { token }),
  sendSlackNotification: (message, channel) => apiClient.post('/integrations/slack/notify', { message, channel }),
  createTrelloCard: (listId, name, description) => apiClient.post('/integrations/trello/create-card', { list_id: listId, name, description }),
  createGitHubIssue: (repo, title, body, labels) => apiClient.post('/integrations/github/create-issue', { repo, title, body, labels }),
  disconnectIntegration: (integrationId) => apiClient.delete(`/integrations/${integrationId}`),
};

// WebSocket API
export const websocketAPI = {
  getOnlineUsers: () => apiClient.get('/online-users'),
};

export default apiClient;