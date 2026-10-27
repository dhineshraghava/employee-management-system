import axios from 'axios';

// Backend API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatically inject JWT Bearer Token into requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ems_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid/expired
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
      localStorage.removeItem('ems_role');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Authentication APIs
// ==========================================
export const unifiedLogin = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const registerUser = (userData) => {
  return api.post('/auth/register', userData);
};

export const forgotPasswordRequest = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPasswordSubmit = (resetData) => {
  return api.post('/auth/reset-password', resetData);
};

export const adminLogin = (credentials) => {
  return api.post('/auth/admin/login', credentials);
};

export const employeeLogin = (credentials) => {
  return api.post('/auth/employee/login', credentials);
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

export const logoutUser = () => {
  return api.post('/auth/logout');
};

// ==========================================
// Admin Panel APIs
// ==========================================
export const getAdminEmployees = (search = '') => {
  return api.get('/admin/employees', {
    params: search && search.trim() ? { search: search.trim() } : {},
  });
};

export const getAdminEmployeeById = (id) => {
  return api.get(`/admin/employees/${id}`);
};

export const createAdminEmployee = (employeeData) => {
  return api.post('/admin/employees', employeeData);
};

export const updateAdminEmployee = (id, employeeData) => {
  return api.put(`/admin/employees/${id}`, employeeData);
};

export const deleteAdminEmployee = (id) => {
  return api.delete(`/admin/employees/${id}`);
};

export const resetEmployeePassword = (id, new_password) => {
  return api.post(`/admin/employees/${id}/reset-password`, { new_password });
};

export const getAdminDashboardStats = async () => {
  try {
    return await api.get('/admin/dashboard/stats');
  } catch (err) {
    // If admin route forbidden (e.g. employee token or session desync), fallback to general stats
    if (err.response?.status === 403 || err.response?.status === 401) {
      return await api.get('/dashboard/stats');
    }
    throw err;
  }
};

export const getAdminReports = () => {
  return api.get('/admin/reports');
};

// ==========================================
// Employee Portal APIs (Scoped to Authenticated User)
// ==========================================
export const getEmployeeProfile = () => {
  return api.get('/employee/profile');
};

export const getEmployeeAttendance = (params = {}) => {
  return api.get('/employee/attendance', { params });
};

export const getEmployeeTasks = (params = {}) => {
  return api.get('/employee/tasks', { params });
};

export const getEmployeeDashboardStats = () => {
  return api.get('/employee/dashboard/stats');
};

export const updateEmployeeTaskStatus = (taskId, status) => {
  return api.patch(`/employee/tasks/${taskId}/status`, { status });
};

export const employeeCheckIn = () => {
  return api.post('/attendance/check-in');
};

export const employeeCheckOut = () => {
  return api.post('/attendance/check-out');
};

// ==========================================
// Shared Attendance & Task Management APIs
// ==========================================
export const getAttendance = (params = {}) => {
  return api.get('/attendance', { params });
};

export const getAttendanceById = (id) => {
  return api.get(`/attendance/${id}`);
};

export const createAttendance = (attendanceData) => {
  return api.post('/attendance', attendanceData);
};

export const updateAttendance = (id, attendanceData) => {
  return api.put(`/attendance/${id}`, attendanceData);
};

export const deleteAttendance = (id) => {
  return api.delete(`/attendance/${id}`);
};

export const getTodayAttendanceSummary = () => {
  return api.get('/attendance/summary/today');
};

export const scanBarcodeAttendance = (scanData) => {
  return api.post('/attendance/scan', scanData);
};

export const getEmployeeBarcodeCard = (employeeId) => {
  return api.get(`/attendance/barcode/card/${employeeId}`);
};

export const getTasks = (params = {}) => {
  return api.get('/tasks', { params });
};

export const getTaskById = (id) => {
  return api.get(`/tasks/${id}`);
};

export const createTask = (taskData) => {
  return api.post('/tasks', taskData);
};

export const updateTask = (id, taskData) => {
  return api.put(`/tasks/${id}`, taskData);
};

export const deleteTask = (id) => {
  return api.delete(`/tasks/${id}`);
};

// ==========================================
// Leave Management APIs (Employee & Admin)
// ==========================================
export const applyLeave = (leaveData) => {
  return api.post('/leaves/apply', leaveData);
};

export const getMyLeaves = () => {
  return api.get('/leaves/my');
};

export const cancelMyLeave = (id) => {
  return api.patch(`/leaves/my/${id}/cancel`);
};

export const getAdminLeaves = (params = {}) => {
  return api.get('/leaves', { params });
};

export const updateLeaveStatus = (id, status, admin_remarks = '') => {
  return api.patch(`/leaves/${id}/status`, { status, admin_remarks });
};

export const deleteLeave = (id) => {
  return api.delete(`/leaves/${id}`);
};

export const getLeaveSummary = () => {
  return api.get('/leaves/summary');
};

// ==========================================
// AI Workforce Intelligence APIs
// ==========================================
export const getAIInsights = () => {
  return api.get('/ai/insights');
};

// Legacy / General access methods
export const getEmployees = (search = '') => getAdminEmployees(search);
export const getEmployeeById = (id) => getAdminEmployeeById(id);
export const createEmployee = (data) => createAdminEmployee(data);
export const updateEmployee = (id, data) => updateAdminEmployee(id, data);
export const deleteEmployee = (id) => deleteAdminEmployee(id);
export const getDashboardStats = () => getAdminDashboardStats();
export const checkHealth = () => api.get('/health');

export default api;
