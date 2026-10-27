import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  UserPlus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CalendarCheck,
  CheckSquare,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  CalendarOff,
  Search,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isEmployee } = useAuth();

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
    pendingLeaves: 0,
    departments: [],
    recentEmployees: [],
    recentAttendance: [],
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');

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
        pendingLeaves: Number(raw.pendingLeaves ?? 0),
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

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Filtered Attendance for compact table
  const filteredAttendance = useMemo(() => {
    if (!attendanceSearch.trim()) return stats.recentAttendance || [];
    const q = attendanceSearch.toLowerCase();
    return (stats.recentAttendance || []).filter(
      (a) =>
        (a.employee_name && a.employee_name.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q)) ||
        (a.status && a.status.toLowerCase().includes(q)) ||
        String(a.employee_id || '').includes(q)
    );
  }, [stats.recentAttendance, attendanceSearch]);

  // Filtered Tasks for compact table
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'ALL') return stats.recentTasks || [];
    if (taskFilter === 'OVERDUE') return (stats.recentTasks || []).filter((t) => t.is_overdue || t.status === 'Overdue');
    return (stats.recentTasks || []).filter((t) => t.status === taskFilter);
  }, [stats.recentTasks, taskFilter]);

  return (
    <div className="dashboard-page hr-theme-page">
      {/* 1. Compact Dark Navy Header Panel */}
      <div className="compact-navy-header">
        <div className="header-meta-group">
          <div className="admin-avatar-box">
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="header-greeting">Welcome back, {user?.name || 'Administrator'}</h1>
            <p className="header-submeta">
              <span>HR Administrator</span>
              <span className="dot-divider">•</span>
              <span>{currentDateFormatted}</span>
            </p>
          </div>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="btn btn-navy-action"
            onClick={fetchStats}
            title="Refresh dashboard metrics"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-navy-primary"
            onClick={() => navigate('/admin/employees/add')}
          >
            <UserPlus size={15} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span className="alert-text">{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={fetchStats}>
            Retry
          </button>
        </div>
      )}

      {/* Pending Leave Review Alert if leaves pending */}
      {stats.pendingLeaves > 0 && (
        <div className="pending-leave-alert-card">
          <div className="flex-align-center gap-10">
            <CalendarOff size={18} className="text-warning" />
            <span className="text-sm font-semibold">
              <strong>{stats.pendingLeaves}</strong> employee leave application(s) awaiting approval.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            onClick={() => navigate('/admin/leaves')}
          >
            Review Requests <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 2. Four Summary Cards in One Row on Desktop */}
      <div className="kpi-summary-grid-4">
        {/* Card 1: Total Employees */}
        <div className="kpi-card" onClick={() => navigate('/admin/employees')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Total Employees</span>
            <div className="kpi-icon-pill blue">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.totalEmployees}</div>
          <div className="kpi-footer-meta">Active staff in directory</div>
        </div>

        {/* Card 2: Present Today */}
        <div className="kpi-card" onClick={() => navigate('/admin/attendance')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Present Today</span>
            <div className="kpi-icon-pill green">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.presentToday}</div>
          <div className="kpi-footer-meta">
            {stats.lateToday > 0 ? `${stats.lateToday} checked in late` : 'Live attendance records'}
          </div>
        </div>

        {/* Card 3: Absent Today */}
        <div className="kpi-card" onClick={() => navigate('/admin/attendance')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Absent Today</span>
            <div className="kpi-icon-pill red">
              <UserX size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.absentToday + stats.leaveToday}</div>
          <div className="kpi-footer-meta">
            {stats.leaveToday > 0 ? `${stats.leaveToday} on approved leave` : 'Unmarked or absent'}
          </div>
        </div>

        {/* Card 4: Active Tasks */}
        <div className="kpi-card" onClick={() => navigate('/admin/tasks')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Active Tasks</span>
            <div className="kpi-icon-pill amber">
              <CheckSquare size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.pendingTasks + stats.inProgressTasks}</div>
          <div className="kpi-footer-meta">
            {stats.completedTasks} completed to date
          </div>
        </div>
      </div>

      {/* Two Column Layout: Attendance Overview & Task Overview */}
      <div className="dashboard-data-grid">
        {/* Attendance Overview Card */}
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">Today's Attendance Overview</h3>
              <p className="content-card-sub">Real-time attendance punches recorded for today</p>
            </div>
            <button
              type="button"
              className="btn-text-action"
              onClick={() => navigate('/admin/attendance')}
            >
              View Full Log <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-search-row">
            <div className="search-field-compact">
              <Search size={14} className="search-icon-sm" />
              <input
                type="text"
                placeholder="Search by name, ID, or department..."
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                className="input-compact"
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="hr-compact-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No attendance punches recorded yet for today.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((att, idx) => (
                    <tr key={att.id || idx}>
                      <td>
                        <strong className="text-navy">{att.employee_name || 'Staff Member'}</strong>
                      </td>
                      <td>
                        <code className="code-id">#{att.employee_id || idx + 1}</code>
                      </td>
                      <td>{att.department || 'General'}</td>
                      <td>{att.check_in || '—'}</td>
                      <td>{att.check_out || '—'}</td>
                      <td>
                        <span className={`status-pill badge-${(att.status || 'present').toLowerCase()}`}>
                          {att.status || 'Present'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Overview Card */}
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">Task Overview</h3>
              <p className="content-card-sub">Assigned deliverables, priorities, and deadlines</p>
            </div>
            <button
              type="button"
              className="btn-text-action"
              onClick={() => navigate('/admin/tasks')}
            >
              Manage Tasks <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-search-row">
            <div className="task-filter-chips">
              <button
                type="button"
                className={`filter-chip ${taskFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setTaskFilter('ALL')}
              >
                All ({stats.recentTasks?.length || 0})
              </button>
              <button
                type="button"
                className={`filter-chip ${taskFilter === 'Pending' ? 'active' : ''}`}
                onClick={() => setTaskFilter('Pending')}
              >
                Pending
              </button>
              <button
                type="button"
                className={`filter-chip ${taskFilter === 'In Progress' ? 'active' : ''}`}
                onClick={() => setTaskFilter('In Progress')}
              >
                In Progress
              </button>
              <button
                type="button"
                className={`filter-chip ${taskFilter === 'Completed' ? 'active' : ''}`}
                onClick={() => setTaskFilter('Completed')}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="hr-compact-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      Loading tasks...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No matching tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isOverdue = t.is_overdue || (t.days_until_due !== undefined && t.days_until_due < 0);
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="flex-align-center gap-6">
                            <strong className="text-navy">{t.title}</strong>
                            {isOverdue && (
                              <span className="overdue-micro-badge" title="Past target due date">
                                <AlertTriangle size={11} /> Overdue
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{t.employee_name || 'Unassigned'}</td>
                        <td>{t.due_date || 'No deadline'}</td>
                        <td>
                          <span className={`priority-tag ${(t.priority || 'medium').toLowerCase()}`}>
                            {t.priority || 'Medium'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              t.status === 'Completed'
                                ? 'badge-completed'
                                : t.status === 'In Progress'
                                ? 'badge-inprogress'
                                : 'badge-pending'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
