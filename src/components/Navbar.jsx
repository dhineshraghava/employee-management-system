import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Database, ShieldCheck, UserCheck, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar, activePage, serverOnline }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? '/login/admin' : '/login/employee');
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'admin-dashboard':
        return 'Admin Dashboard';
      case 'admin-employees':
        return 'Employee Management';
      case 'admin-add':
        return 'Add Employee';
      case 'admin-edit':
        return 'Edit Employee Record';
      case 'admin-attendance':
        return 'Attendance Management';
      case 'admin-tasks':
        return 'Task Management';
      case 'admin-reports':
        return 'Reports & Analytics';
      case 'employee-dashboard':
        return 'My Dashboard';
      case 'employee-profile':
        return 'My Profile';
      case 'employee-attendance':
        return 'Mark Attendance';
      case 'employee-tasks':
        return 'My Assigned Tasks';
      default:
        return 'Employee Management System';
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          id="menu-toggle-btn"
        >
          <Menu size={20} />
        </button>
        <div className="page-breadcrumb">
          <span className="breadcrumb-root">{isAdmin ? 'Admin' : 'Employee'}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{getPageTitle()}</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* MySQL Database Connection Status Indicator */}
        <div className={`db-status-pill ${serverOnline ? 'connected' : 'disconnected'}`}>
          <Database size={15} className="db-icon" />
          <span className="status-dot"></span>
          <span className="status-label">
            {serverOnline ? 'emp_db Online' : 'Connecting...'}
          </span>
        </div>

        {/* User Profile Chip */}
        <div className="user-profile-chip">
          <div className={`avatar-circle ${isAdmin ? 'admin-avatar' : 'emp-avatar'}`}>
            <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || (isAdmin ? 'Admin' : 'Employee')}</span>
            <span className="user-role">{isAdmin ? 'Administrator' : user?.department || 'Employee'}</span>
          </div>
        </div>

        {/* Quick Sign Out Button */}
        <button
          type="button"
          className="navbar-logout-btn"
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign Out"
          id="nav-logout-btn"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
