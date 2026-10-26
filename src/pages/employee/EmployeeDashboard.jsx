import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Clock,
  CalendarCheck,
  CheckSquare,
  AlertTriangle,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
} from 'lucide-react';
import {
  getEmployeeDashboardStats,
  employeeCheckIn,
  employeeCheckOut,
  updateEmployeeTaskStatus,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({
    profile: null,
    todayAttendance: null,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    recentAttendance: [],
    recentTasks: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEmployeeDashboardStats();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError('Unable to load your personal dashboard data from MySQL.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const res = await employeeCheckIn();
      showToast('success', res.data?.message || 'Check-in recorded successfully!');
      loadStats();
    } catch (err) {
      console.error('Check-in error:', err);
      showToast('error', err.response?.data?.message || 'Check-in failed.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const res = await employeeCheckOut();
      showToast('success', res.data?.message || 'Check-out recorded successfully!');
      loadStats();
    } catch (err) {
      console.error('Check-out error:', err);
      showToast('error', err.response?.data?.message || 'Check-out failed.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateEmployeeTaskStatus(taskId, newStatus);
      showToast('success', `Task marked as "${newStatus}".`);
      loadStats();
    } catch (err) {
      console.error('Error updating task:', err);
      showToast('error', err.response?.data?.message || 'Failed to update task.');
    }
  };

  const todayAtt = data.todayAttendance;
  const isCheckedIn = Boolean(todayAtt && todayAtt.check_in);
  const isCheckedOut = Boolean(todayAtt && todayAtt.check_out);

  return (
    <div className="employee-dashboard-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`page-toast ${toastMessage.type}`} role="alert">
          {toastMessage.type === 'success' ? (
            <CheckCircle size={18} className="toast-icon" />
          ) : (
            <AlertCircle size={18} className="toast-icon" />
          )}
          <span>{toastMessage.text}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
            ×
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="welcome-banner emp-banner">
        <div className="welcome-content">
          <div className="badge-pill emp-pill">
            <User size={14} />
            <span>Employee Workspace • ID: #{user?.id}</span>
          </div>
          <h1 className="welcome-title">Welcome back, {user?.name || 'Employee'}!</h1>
          <p className="welcome-subtitle">
            Department: <strong>{data.profile?.department || user?.department || 'General'}</strong> | Designation: <strong>{data.profile?.designation || 'Staff'}</strong> | Email: <strong>{user?.email}</strong>
          </p>
        </div>
      </div>

      {/* Quick Attendance Check-In / Check-Out Widget */}
      <div className="emp-attendance-action-card">
        <div className="attendance-action-info">
          <div className="clock-icon-box">
            <Clock size={28} className="text-teal" />
          </div>
          <div>
            <h3 className="attendance-action-title">Today's Attendance Status</h3>
            <p className="attendance-action-sub">
              {todayAtt ? (
                <span>
                  Status: <strong>{todayAtt.status}</strong> |{' '}
                  Check-in: <strong>{todayAtt.check_in || 'Pending'}</strong> |{' '}
                  Check-out: <strong>{todayAtt.check_out || 'Pending'}</strong>
                </span>
              ) : (
                'You have not marked attendance for today yet.'
              )}
            </p>
          </div>
        </div>

        <div className="attendance-action-buttons">
          <button
            type="button"
            className="btn btn-teal"
            onClick={handleCheckIn}
            disabled={isCheckedIn || checkingIn}
            id="btn-emp-checkin"
          >
            <LogIn size={18} />
            <span>{isCheckedIn ? `Checked In (${todayAtt.check_in})` : checkingIn ? 'Recording...' : 'Check In Now'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={handleCheckOut}
            disabled={!isCheckedIn || isCheckedOut || checkingOut}
            id="btn-emp-checkout"
          >
            <LogOut size={18} />
            <span>{isCheckedOut ? `Checked Out (${todayAtt.check_out})` : checkingOut ? 'Recording...' : 'Check Out Now'}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadStats}>
            Retry
          </button>
        </div>
      )}

      {/* Tasks Overview Cards */}
      <div className="stats-cards-grid">
        <div className="stat-card stat-blue cursor-pointer" onClick={() => navigate('/employee/tasks')}>
          <div className="stat-card-icon-box">
            <CheckSquare size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">My Assigned Tasks</span>
            <h2 className="stat-card-value">{loading ? '...' : data.totalTasks}</h2>
            <span className="stat-card-meta">Assigned by admin</span>
          </div>
        </div>

        <div className="stat-card stat-amber cursor-pointer" onClick={() => navigate('/employee/tasks')}>
          <div className="stat-card-icon-box">
            <Clock size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Pending</span>
            <h2 className="stat-card-value">{loading ? '...' : data.pendingTasks}</h2>
            <span className="stat-card-meta">Awaiting start</span>
          </div>
        </div>

        <div className="stat-card stat-purple cursor-pointer" onClick={() => navigate('/employee/tasks')}>
          <div className="stat-card-icon-box">
            <Briefcase size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">In Progress</span>
            <h2 className="stat-card-value">{loading ? '...' : data.inProgressTasks}</h2>
            <span className="stat-card-meta">Being actively worked</span>
          </div>
        </div>

        <div className="stat-card stat-teal cursor-pointer" onClick={() => navigate('/employee/tasks')}>
          <div className="stat-card-icon-box">
            <CheckCircle size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Completed</span>
            <h2 className="stat-card-value">{loading ? '...' : data.completedTasks}</h2>
            <span className="stat-card-meta">Finished deliverables</span>
          </div>
        </div>

        {data.overdueTasks > 0 && (
          <div className="stat-card stat-red">
            <div className="stat-card-icon-box">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-label">Overdue Tasks</span>
              <h2 className="stat-card-value">{data.overdueTasks}</h2>
              <span className="stat-card-meta">Past target deadline!</span>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Recent Assigned Tasks & Attendance Log */}
      <div className="dashboard-grid-sections">
        {/* Assigned Tasks */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-title-box">
              <CheckSquare size={20} className="text-blue" />
              <h3>My Recent Tasks</h3>
            </div>
            <button className="btn-text-link" onClick={() => navigate('/employee/tasks')}>
              View All Tasks <ArrowRight size={14} />
            </button>
          </div>

          <div className="section-card-body">
            {loading ? (
              <div className="section-loading">Loading your assigned tasks...</div>
            ) : data.recentTasks.length === 0 ? (
              <div className="recent-empty">
                <p>No tasks currently assigned to you.</p>
              </div>
            ) : (
              <div className="recent-employees-list">
                {data.recentTasks.map((t) => (
                  <div key={t.id} className="recent-employee-row">
                    <div className="recent-info" style={{ flex: 1 }}>
                      <div className="flex-align-center gap-6">
                        <h4 className="recent-name">{t.title}</h4>
                        {t.is_overdue === 1 && (
                          <span className="overdue-tag">
                            <AlertTriangle size={12} /> Overdue
                          </span>
                        )}
                      </div>
                      <p className="recent-email">
                        Due: {t.due_date || 'No deadline'} | Priority: {t.priority}
                      </p>
                    </div>

                    <div>
                      <select
                        className={`status-select ${
                          t.status === 'Completed'
                            ? 'badge-present'
                            : t.status === 'In Progress'
                            ? 'badge-late'
                            : 'badge-absent'
                        }`}
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        title="Update task status"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-title-box">
              <CalendarCheck size={20} className="text-teal" />
              <h3>My Attendance History</h3>
            </div>
            <button className="btn-text-link" onClick={() => navigate('/employee/attendance')}>
              View Full History <ArrowRight size={14} />
            </button>
          </div>

          <div className="section-card-body">
            {loading ? (
              <div className="section-loading">Loading attendance history...</div>
            ) : data.recentAttendance.length === 0 ? (
              <div className="recent-empty">
                <p>No attendance records logged yet.</p>
              </div>
            ) : (
              <div className="recent-employees-list">
                {data.recentAttendance.map((att) => (
                  <div key={att.id} className="recent-employee-row">
                    <div className="recent-info">
                      <h4 className="recent-name">{att.date}</h4>
                      <p className="recent-email">
                        {att.check_in ? `In: ${att.check_in}` : 'No check-in'}{' '}
                        {att.check_out ? `• Out: ${att.check_out}` : ''}
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
      </div>
    </div>
  );
}
