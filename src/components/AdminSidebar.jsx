import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  CheckSquare,
  BarChart3,
  LogOut,
  Database,
  X,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo-icon admin-badge-bg">
              <ShieldCheck size={24} color="#ffffff" />
            </div>
            <div className="brand-text">
              <span className="brand-title">Admin Portal</span>
              <span className="brand-subtitle">StaffPulse EMS</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar admin">AD</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'Administrator'}</span>
            <span className="sidebar-user-role">Super Admin</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">ADMINISTRATION</div>

          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-dashboard"
          >
            <LayoutDashboard size={20} className="link-icon" />
            <span className="link-text">Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/employees"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-employees"
          >
            <Users size={20} className="link-icon" />
            <span className="link-text">Employee Management</span>
          </NavLink>

          <NavLink
            to="/admin/employees/add"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-add-emp"
          >
            <UserPlus size={20} className="link-icon" />
            <span className="link-text">Register Employee</span>
          </NavLink>

          <div className="nav-section-title">WORKFORCE OPERATIONS</div>

          <NavLink
            to="/admin/attendance"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-attendance"
          >
            <CalendarCheck size={20} className="link-icon" />
            <span className="link-text">Attendance Management</span>
          </NavLink>

          <NavLink
            to="/admin/tasks"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-tasks"
          >
            <CheckSquare size={20} className="link-icon" />
            <span className="link-text">Task Management</span>
          </NavLink>

          <NavLink
            to="/admin/reports"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-reports"
          >
            <BarChart3 size={20} className="link-icon" />
            <span className="link-text">Reports & Analytics</span>
          </NavLink>
        </nav>

        {/* Footer & Logout */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            id="btn-admin-logout"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          <div className="db-info-card">
            <div className="db-info-header">
              <Database size={14} className="text-blue" />
              <span>Database Linked</span>
            </div>
            <p className="db-name">emp_db</p>
          </div>
        </div>
      </aside>
    </>
  );
}
