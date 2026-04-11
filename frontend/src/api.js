import axios from 'axios';

const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    'https://faculty-feedback-d38s.onrender.com/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ffs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const googleAuth = (data) => API.post('/auth/google', data);
export const getMe = () => API.get('/auth/me');

// Subjects
export const getSubjects = (params) => API.get('/subjects', { params });
export const createSubject = (data) => API.post('/subjects', data);
export const updateSubject = (id, data) => API.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => API.delete(`/subjects/${id}`);

// Feedback
export const submitFeedback = (data) => API.post('/feedback', data);
export const getMyFeedback = () => API.get('/feedback/mine');
export const getAllFeedback = (params) => API.get('/feedback/all', { params });
export const getFacultyStats = (params) => API.get('/feedback/stats', { params });

// Admin
export const getAdminSummary = () => API.get('/admin/summary');

export default API;

// Forgot Password
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const verifyOTP = (data) => API.post('/auth/verify-otp', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);