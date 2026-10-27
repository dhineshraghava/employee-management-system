import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  CalendarOff,
  CheckSquare,
  BarChart3,
  LogOut,
  Database,
  X,
  ShieldCheck,
  Camera,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLeaveSummary } from '../services/api';

export default function AdminSidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [pendingLeavesCount, setPendingLeavesCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    const fetchLeaves = async () => {
      try {
        const res = await getLeaveSummary();
        if (isMounted && res.data?.summary?.pending) {
          setPendingLeavesCount(res.data.summary.pending);
        }
      } catch {
        // silent fallback
      }
    };
    fetchLeaves();
    const interval = setInterval(fetchLeaves, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div className="brand-text">
              <span className="brand-title">StaffPulse EMS</span>
              <span className="brand-subtitle">HR Admin Portal</span>
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
            <span className="sidebar-user-role">HR Administrator</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-dashboard"
          >
            <LayoutDashboard size={18} className="link-icon" />
            <span className="link-text">Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/employees"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-employees"
          >
            <Users size={18} className="link-icon" />
            <span className="link-text">Manage Employees</span>
          </NavLink>

          <NavLink
            to="/admin/employees/add"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-add-emp"
          >
            <UserPlus size={18} className="link-icon" />
            <span className="link-text">Add Employee</span>
          </NavLink>

          <NavLink
            to="/admin/barcode-cards"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-barcode-cards"
          >
            <CreditCard size={18} className="link-icon" />
            <span className="link-text">Employee Barcode Cards</span>
          </NavLink>

          <NavLink
            to="/admin/barcode-attendance"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-barcode-attendance"
          >
            <Camera size={18} className="link-icon" />
            <span className="link-text">Barcode Attendance</span>
          </NavLink>

          <NavLink
            to="/admin/attendance"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-attendance"
          >
            <CalendarCheck size={18} className="link-icon" />
            <span className="link-text">Attendance Records</span>
          </NavLink>

          <NavLink
            to="/admin/tasks"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-tasks"
          >
            <CheckSquare size={18} className="link-icon" />
            <span className="link-text">Tasks</span>
          </NavLink>

          <NavLink
            to="/admin/leaves"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-leaves"
          >
            <CalendarOff size={18} className="link-icon" />
            <span className="link-text">Leave Requests</span>
            {pendingLeavesCount > 0 && (
              <span className="sidebar-badge-count" title={`${pendingLeavesCount} pending leave applications`}>
                {pendingLeavesCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/reports"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-admin-reports"
          >
            <BarChart3 size={18} className="link-icon" />
            <span className="link-text">Analytics</span>
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
