import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  CalendarOff,
  CheckSquare,
  LogOut,
  Database,
  X,
  Building2,
  Briefcase,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EmployeeSidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'EP';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container employee-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <Briefcase size={20} color="#ffffff" />
            </div>
            <div className="brand-text">
              <span className="brand-title">StaffPulse EMS</span>
              <span className="brand-subtitle">Employee Portal</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar employee">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'Employee'}</span>
            <span className="sidebar-user-role">{user?.department || 'Staff Member'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <NavLink
            to="/employee/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-emp-dashboard"
          >
            <LayoutDashboard size={18} className="link-icon" />
            <span className="link-text">My Dashboard</span>
          </NavLink>

          <NavLink
            to="/employee/tasks"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-emp-tasks"
          >
            <CheckSquare size={18} className="link-icon" />
            <span className="link-text">My Tasks</span>
          </NavLink>

          <NavLink
            to="/employee/attendance"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-emp-attendance"
          >
            <CalendarCheck size={18} className="link-icon" />
            <span className="link-text">My Attendance</span>
          </NavLink>

          <NavLink
            to="/employee/profile"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-emp-profile"
          >
            <User size={18} className="link-icon" />
            <span className="link-text">My Profile</span>
          </NavLink>

          <NavLink
            to="/employee/leaves"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-emp-leaves"
          >
            <CalendarOff size={18} className="link-icon" />
            <span className="link-text">Apply Leave</span>
          </NavLink>

          <NavLink
            to="/employee/barcode-attendance"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-emp-barcode-scanner"
          >
            <Camera size={18} className="link-icon" />
            <span className="link-text">Barcode Scanner</span>
          </NavLink>
        </nav>

        {/* Footer & Logout */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            id="btn-employee-logout"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          <div className="db-info-card">
            <div className="db-info-header">
              <Database size={14} className="text-blue" />
              <span>Database Connected</span>
            </div>
            <p className="db-name">emp_db • My Account</p>
          </div>
        </div>
      </aside>
    </>
  );
}
