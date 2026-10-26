import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  DollarSign,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Database,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CalendarCheck,
  CheckSquare,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, isEmployee } = useAuth();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeDepartments: 0,
    totalSalary: 0,
    averageSalary: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    leaveToday: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalTasks: 0,
    departments: [],
    recentEmployees: [],
    recentAttendance: [],
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardStats();

      const raw = res.data?.data ? res.data.data : res.data;

      setStats({
        totalEmployees: Number(raw.totalEmployees ?? 0),
        activeDepartments: Number(raw.activeDepartments ?? (raw.departments ? raw.departments.length : 0)),
        averageSalary: Number(raw.averageSalary ?? 0),
        totalSalary: Number(raw.totalSalary ?? 0),
        presentToday: Number(raw.presentToday ?? 0),
        absentToday: Number(raw.absentToday ?? 0),
        lateToday: Number(raw.lateToday ?? 0),
        leaveToday: Number(raw.leaveToday ?? 0),
        pendingTasks: Number(raw.pendingTasks ?? 0),
        inProgressTasks: Number(raw.inProgressTasks ?? 0),
        completedTasks: Number(raw.completedTasks ?? 0),
        overdueTasks: Number(raw.overdueTasks ?? 0),
        totalTasks: Number(raw.totalTasks ?? 0),
        departments: Array.isArray(raw.departments) ? raw.departments : [],
        recentEmployees: Array.isArray(raw.recentEmployees) ? raw.recentEmployees : [],
        recentAttendance: Array.isArray(raw.recentAttendance) ? raw.recentAttendance : [],
        recentTasks: Array.isArray(raw.recentTasks) ? raw.recentTasks : [],
      });
    } catch (err) {
      console.error('Failed to load dashboard statistics from MySQL:', err);
      const isAuthError = err.response?.status === 401 || err.response?.status === 403;
      const serverMsg = err.response?.data?.message || err.message;
      if (isAuthError) {
        setError(
          `Administrator privileges required. ${serverMsg ? `(${serverMsg})` : ''} Please log in with your Admin account.`
        );
      } else {
        setError(
          `Unable to load live statistics from MySQL backend. ${serverMsg ? `(${serverMsg})` : ''} Please verify your backend server is running on port 5000 and MySQL credentials are configured in backend/.env.`
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEmployee) {
      navigate('/employee/dashboard', { replace: true });
      return;
    }
    fetchStats();
  }, [fetchStats, isEmployee, navigate]);

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const taskCompletionPercent = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <div className="badge-pill">
            <Sparkles size={14} className="icon-gold" />
            <span>MySQL <code>emp_db</code> Live Integration</span>
          </div>
          <h1 className="welcome-title">Employee Management System</h1>
          <p className="welcome-subtitle">
            Real-time management of workforce personnel, daily attendance tracking, and task assignments backed by MySQL database.
          </p>
          <div className="banner-quick-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/add')}
              id="dashboard-btn-add"
            >
              <UserPlus size={18} />
              <span>Add Employee</span>
            </button>
            <button
              className="btn btn-outline-light"
              onClick={() => navigate('/attendance')}
              id="dashboard-btn-attendance"
            >
              <CalendarCheck size={18} />
              <span>Mark Attendance</span>
            </button>
            <button
              className="btn btn-outline-light"
              onClick={() => navigate('/tasks')}
              id="dashboard-btn-tasks"
            >
              <CheckSquare size={18} />
              <span>Assign Task</span>
            </button>
            <button
              className="btn btn-icon-ghost"
              onClick={fetchStats}
              title="Refresh Dashboard"
              aria-label="Refresh Dashboard"
              id="dashboard-btn-refresh"
            >
              <RefreshCw size={18} className={loading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={22} className="alert-icon" />
          <span className="alert-text">{error}</span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={fetchStats}
              id="dashboard-btn-retry"
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
              <span>Retry</span>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                logout();
                navigate('/login/admin');
              }}
              id="dashboard-btn-login-admin"
            >
              <span>Sign in as Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Metric Cards Row */}
      <div className="stats-cards-grid">
        {/* Card 1: Total Employees */}
        <div className="stat-card stat-blue cursor-pointer" onClick={() => navigate('/employees')}>
          <div className="stat-card-icon-box">
            <Users size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Employees</span>
            <h2 className="stat-card-value">
              {loading ? '...' : stats.totalEmployees}
            </h2>
            <span className="stat-card-meta">table: employees</span>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="stat-card stat-teal cursor-pointer" onClick={() => navigate('/attendance')}>
          <div className="stat-card-icon-box">
            <UserCheck size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Present Today</span>
            <h2 className="stat-card-value">
              {loading ? '...' : stats.presentToday}
            </h2>
            <span className="stat-card-meta">
              {stats.lateToday > 0 ? `${stats.lateToday} arrived late` : 'Live attendance'}
            </span>
          </div>
        </div>

        {/* Card 3: Absent / Leave Today */}
        <div className="stat-card stat-red cursor-pointer" onClick={() => navigate('/attendance')}>
          <div className="stat-card-icon-box">
            <UserX size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Absent / Leave</span>
            <h2 className="stat-card-value">
              {loading ? '...' : stats.absentToday + stats.leaveToday}
            </h2>
            <span className="stat-card-meta">
              {stats.leaveToday} approved leave
            </span>
          </div>
        </div>

        {/* Card 4: Tasks Pending & In Progress */}
        <div className="stat-card stat-purple cursor-pointer" onClick={() => navigate('/tasks')}>
          <div className="stat-card-icon-box">
            <CheckSquare size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Active Tasks</span>
            <h2 className="stat-card-value">
              {loading ? '...' : stats.pendingTasks + stats.inProgressTasks}
            </h2>
            <span className="stat-card-meta">
              {stats.completedTasks} completed
            </span>
          </div>
        </div>
      </div>

      {/* Task Completion Progress Bar Card */}
      <div className="task-progress-card">
        <div className="progress-header">
          <div>
            <h3 className="progress-title">Task Completion Progress</h3>
            <p className="progress-sub">
              {stats.completedTasks} of {stats.totalTasks} total assigned tasks completed across all departments
            </p>
          </div>
          <div className="progress-badge">
            {taskCompletionPercent}% Completed
          </div>
        </div>
        <div className="progress-bar-track-large">
          <div
            className="progress-bar-fill-large"
            style={{ width: `${taskCompletionPercent}%` }}
          ></div>
        </div>
        <div className="task-metrics-breakdown">
          <span className="metric-chip chip-pending">
            <Clock size={12} /> {stats.pendingTasks} Pending
          </span>
          <span className="metric-chip chip-progress">
            <TrendingUp size={12} /> {stats.inProgressTasks} In Progress
          </span>
          <span className="metric-chip chip-completed">
            <CheckSquare size={12} /> {stats.completedTasks} Completed
          </span>
          {stats.overdueTasks > 0 && (
            <span className="metric-chip chip-overdue">
              <AlertTriangle size={12} /> {stats.overdueTasks} Overdue
            </span>
          )}
        </div>
      </div>

      {/* Two Column Layout: Department Distribution & Recent Employees */}
      <div className="dashboard-grid-sections">
        {/* Department-wise Employee Counts */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-title-box">
              <Building size={20} className="text-blue" />
              <h3>Department Breakdown & Payroll</h3>
            </div>
            <span className="section-badge">
              {stats.departments ? stats.departments.length : 0} Departments
            </span>
          </div>

          <div className="section-card-body">
            {loading ? (
              <div className="section-loading">Calculating department statistics from MySQL...</div>
            ) : !stats.departments || stats.departments.length === 0 ? (
              <div className="recent-empty">
                <p>No department records found in database.</p>
              </div>
            ) : (
              <div className="dept-distribution-list">
                {stats.departments.map((dept) => {
                  const percentage = stats.totalEmployees > 0
                    ? Math.round((dept.count / stats.totalEmployees) * 100)
                    : 0;

                  return (
                    <div key={dept.name} className="dept-item">
                      <div className="dept-item-header">
                        <span className="dept-name-label">{dept.name}</span>
                        <div className="dept-count-tags">
                          <span className="dept-count-badge">
                            {dept.count} {dept.count === 1 ? 'employee' : 'employees'}
                          </span>
                          <span className="dept-avg-salary">
                            Avg: {formatCurrency(dept.avgSalary)}
                          </span>
                        </div>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recently Added Employees Preview */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-title-box">
              <Users size={20} className="text-purple" />
              <h3>Recently Added Employees</h3>
            </div>
            <button
              className="btn-text-link"
              onClick={() => navigate('/employees')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="section-card-body">
            {loading ? (
              <div className="section-loading">Fetching latest employees from MySQL...</div>
            ) : !stats.recentEmployees || stats.recentEmployees.length === 0 ? (
              <div className="recent-empty">
                <p>No employees registered yet.</p>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/add')}
                >
                  Add First Employee
                </button>
              </div>
            ) : (
              <div className="recent-employees-list">
                {stats.recentEmployees.map((emp) => (
                  <div key={emp.id} className="recent-employee-row">
                    <div className="recent-avatar">
                      {(emp.name || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div className="recent-info">
                      <h4 className="recent-name">{emp.name}</h4>
                      <p className="recent-email">{emp.email}</p>
                    </div>
                    <div className="recent-dept-pill">
                      {emp.department || 'General'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Grid Row: Recent Attendance & Recent Tasks */}
      <div className="dashboard-grid-sections mt-6">
        {/* Recent Attendance Activity */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-title-box">
              <CalendarCheck size={20} className="text-teal" />
              <h3>Recent Attendance Records</h3>
            </div>
            <button
              className="btn-text-link"
              onClick={() => navigate('/attendance')}
            >
              Open Attendance <ArrowRight size={14} />
            </button>
          </div>

          <div className="section-card-body">
            {loading ? (
              <div className="section-loading">Loading recent attendance from MySQL...</div>
            ) : !stats.recentAttendance || stats.recentAttendance.length === 0 ? (
              <div className="recent-empty">
                <p>No attendance records logged yet.</p>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => navigate('/attendance')}
                >
                  Mark Attendance
                </button>
              </div>
            ) : (
              <div className="recent-employees-list">
                {stats.recentAttendance.map((att) => (
                  <div key={att.id} className="recent-employee-row">
                    <div className="recent-avatar teal">
                      {(att.employee_name || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div className="recent-info">
                      <h4 className="recent-name">{att.employee_name}</h4>
                      <p className="recent-email">
                        {att.date} • {att.check_in ? `In: ${att.check_in}` : 'No check-in'}
                      </p>
                    </div>
                    <div className={`status-pill badge-${att.status.toLowerCase()}`}>
                      {att.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks Activity */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-title-box">
              <CheckSquare size={20} className="text-amber" />
              <h3>Recent Tasks Assigned</h3>
            </div>
            <button
              className="btn-text-link"
              onClick={() => navigate('/tasks')}
            >
              Open Tasks <ArrowRight size={14} />
            </button>
          </div>

          <div className="section-card-body">
            {loading ? (
              <div className="section-loading">Loading recent tasks from MySQL...</div>
            ) : !stats.recentTasks || stats.recentTasks.length === 0 ? (
              <div className="recent-empty">
                <p>No tasks assigned yet.</p>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => navigate('/tasks')}
                >
                  Assign Task
                </button>
              </div>
            ) : (
              <div className="recent-employees-list">
                {stats.recentTasks.map((t) => (
                  <div key={t.id} className="recent-employee-row">
                    <div className="recent-avatar purple">
                      {(t.employee_name || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div className="recent-info">
                      <h4 className="recent-name line-clamp-1">{t.title}</h4>
                      <p className="recent-email">
                        Assigned to: {t.employee_name} • Due: {t.due_date || 'No due date'}
                      </p>
                    </div>
                    <div className={`status-pill ${t.status === 'Completed' ? 'badge-present' : t.status === 'In Progress' ? 'badge-late' : 'badge-absent'}`}>
                      {t.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
