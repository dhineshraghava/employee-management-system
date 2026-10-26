import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  CheckSquare,
  Database,
  X,
  Building2,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <Building2 size={24} color="#ffffff" />
            </div>
            <div className="brand-text">
              <span className="brand-title">StaffPulse</span>
              <span className="brand-subtitle">Employee System</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">MAIN NAVIGATION</div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-dashboard-link"
          >
            <LayoutDashboard size={20} className="link-icon" />
            <span className="link-text">Dashboard</span>
          </NavLink>

          <NavLink
            to="/employees"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-employees-link"
          >
            <Users size={20} className="link-icon" />
            <span className="link-text">View Employees</span>
          </NavLink>

          <NavLink
            to="/add"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-add-link"
          >
            <UserPlus size={20} className="link-icon" />
            <span className="link-text">Add Employee</span>
          </NavLink>

          <div className="nav-section-title">WORKFORCE OPERATIONS</div>

          <NavLink
            to="/attendance"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-attendance-link"
          >
            <CalendarCheck size={20} className="link-icon" />
            <span className="link-text">Attendance</span>
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            id="nav-tasks-link"
          >
            <CheckSquare size={20} className="link-icon" />
            <span className="link-text">Tasks</span>
          </NavLink>
        </nav>

        {/* Database Meta Card in Footer */}
        <div className="sidebar-footer">
          <div className="db-info-card">
            <div className="db-info-header">
              <Database size={15} className="text-blue" />
              <span>MySQL Live Linked</span>
            </div>
            <p className="db-name">emp_db</p>
            <span className="table-badge">employees • tasks • attendance</span>
          </div>
        </div>
      </aside>
    </>
  );
}
