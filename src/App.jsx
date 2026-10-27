import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import EmployeeSidebar from './components/EmployeeSidebar';
import Login from './pages/Login';

// Admin Pages
import Dashboard from './pages/Dashboard';
import ViewEmployees from './pages/ViewEmployees';
import AddEmployee from './pages/AddEmployee';
import EditEmployee from './pages/EditEmployee';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import AdminReports from './pages/admin/AdminReports';
import AdminLeaves from './pages/admin/AdminLeaves';
import BarcodeAttendance from './pages/BarcodeAttendance';
import AdminBarcodeCards from './pages/admin/AdminBarcodeCards';

// Employee Portal Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeTasks from './pages/employee/EmployeeTasks';
import EmployeeLeaves from './pages/employee/EmployeeLeaves';

import { checkHealth } from './services/api';
import './App.css';

// Guard for Admin Only Pages
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isEmployee, loading } = useAuth();
  if (loading) return <div className="app-loading-screen"><div className="loading-spinner"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isEmployee) return <Navigate to="/employee/dashboard" replace />;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

// Guard for Employee Only Pages
function EmployeeRoute({ children }) {
  const { isAuthenticated, isEmployee, isAdmin, loading } = useAuth();
  if (loading) return <div className="app-loading-screen"><div className="loading-spinner"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (!isEmployee) return <Navigate to="/login" replace />;
  return children;
}

// Root Route Redirector
function RootRedirect() {
  const { isAuthenticated, isAdmin, isEmployee, loading } = useAuth();
  if (loading) return <div className="app-loading-screen"><div className="loading-spinner"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isEmployee) return <Navigate to="/employee/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

// Main App Layout Wrapper with Responsive Navigation
function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const getActivePageKey = () => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard')) return 'admin-dashboard';
    if (p.includes('/admin/employees/add')) return 'admin-add';
    if (p.includes('/admin/employees/') && p.includes('/edit')) return 'admin-edit';
    if (p.includes('/admin/employees')) return 'admin-employees';
    if (p.includes('/admin/barcode-attendance')) return 'admin-barcode-attendance';
    if (p.includes('/admin/barcode-cards')) return 'admin-barcode-cards';
    if (p.includes('/admin/attendance')) return 'admin-attendance';
    if (p.includes('/admin/leaves')) return 'admin-leaves';
    if (p.includes('/admin/tasks')) return 'admin-tasks';
    if (p.includes('/admin/reports')) return 'admin-reports';

    if (p.includes('/employee/dashboard')) return 'employee-dashboard';
    if (p.includes('/employee/profile')) return 'employee-profile';
    if (p.includes('/employee/barcode-attendance')) return 'employee-barcode-attendance';
    if (p.includes('/employee/attendance')) return 'employee-attendance';
    if (p.includes('/employee/leaves')) return 'employee-leaves';
    if (p.includes('/employee/tasks')) return 'employee-tasks';

    return 'dashboard';
  };

  const verifyBackendStatus = useCallback(async () => {
    try {
      const res = await checkHealth();
      if (res.data?.status === 'online' || res.status === 200) {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  }, []);

  useEffect(() => {
    verifyBackendStatus();
    const interval = setInterval(verifyBackendStatus, 12000);
    return () => clearInterval(interval);
  }, [verifyBackendStatus]);

  // If on login or registration pages, render full screen without sidebars
  if (location.pathname.startsWith('/login') || location.pathname === '/register') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/admin" element={<Navigate to="/login" replace />} />
        <Route path="/login/employee" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      {/* Role-Specific Sidebar */}
      {isAdmin ? (
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      ) : (
        <EmployeeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          activePage={getActivePageKey()}
          serverOnline={serverOnline}
        />

        <main className="page-body">
          <Routes>
            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Panel Protected Routes */}
            <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/admin/employees" element={<AdminRoute><ViewEmployees /></AdminRoute>} />
            <Route path="/admin/employees/add" element={<AdminRoute><AddEmployee /></AdminRoute>} />
            <Route path="/admin/employees/:id" element={<AdminRoute><ViewEmployees /></AdminRoute>} />
            <Route path="/admin/employees/:id/edit" element={<AdminRoute><EditEmployee /></AdminRoute>} />
            <Route path="/admin/barcode-attendance" element={<AdminRoute><BarcodeAttendance /></AdminRoute>} />
            <Route path="/admin/barcode-cards" element={<AdminRoute><AdminBarcodeCards /></AdminRoute>} />
            <Route path="/admin/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
            <Route path="/admin/leaves" element={<AdminRoute><AdminLeaves /></AdminRoute>} />
            <Route path="/admin/tasks" element={<AdminRoute><Tasks /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

            {/* Employee Panel Protected Routes */}
            <Route path="/employee/dashboard" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
            <Route path="/employee/profile" element={<EmployeeRoute><EmployeeProfile /></EmployeeRoute>} />
            <Route path="/employee/barcode-attendance" element={<EmployeeRoute><BarcodeAttendance /></EmployeeRoute>} />
            <Route path="/employee/attendance" element={<EmployeeRoute><EmployeeAttendance /></EmployeeRoute>} />
            <Route path="/employee/leaves" element={<EmployeeRoute><EmployeeLeaves /></EmployeeRoute>} />
            <Route path="/employee/tasks" element={<EmployeeRoute><EmployeeTasks /></EmployeeRoute>} />

            {/* Legacy URL Redirects */}
            <Route path="/employees" element={<Navigate to="/admin/employees" replace />} />
            <Route path="/add" element={<Navigate to="/admin/employees/add" replace />} />
            <Route path="/edit/:id" element={<Navigate to="/admin/employees/:id/edit" replace />} />
            <Route path="/attendance" element={<Navigate to="/admin/attendance" replace />} />
            <Route path="/leaves" element={<Navigate to="/admin/leaves" replace />} />
            <Route path="/tasks" element={<Navigate to="/admin/tasks" replace />} />

            {/* Catch-All */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
