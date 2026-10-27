import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Clock,
  CalendarCheck,
  CheckSquare,
  AlertTriangle,
  LogIn,
  LogOut,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Briefcase,
  CalendarOff,
  CreditCard,
  Building2,
  Printer,
  Download,
  Eye,
} from 'lucide-react';
import {
  getEmployeeDashboardStats,
  employeeCheckIn,
  employeeCheckOut,
  updateEmployeeTaskStatus,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EmployeeBarcodeCard from '../../components/EmployeeBarcodeCard';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const badgeSectionRef = useRef(null);

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
  const [showIdCardModal, setShowIdCardModal] = useState(false);

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

  const scrollToBadge = () => {
    if (badgeSectionRef.current) {
      badgeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowIdCardModal(true);
    }
  };

  const todayAtt = data.todayAttendance;
  const isCheckedIn = Boolean(todayAtt && todayAtt.check_in);
  const isCheckedOut = Boolean(todayAtt && todayAtt.check_out);

  const employeeObject = {
    id: data.profile?.id || user?.id || 1,
    name: data.profile?.name || user?.name || 'Staff Member',
    department: data.profile?.department || user?.department || 'Operations',
    designation: data.profile?.designation || 'Specialist',
    email: data.profile?.email || user?.email || 'employee@ems.com',
    barcode: data.profile?.barcode || `EMP-${data.profile?.id || user?.id || 1}`,
  };

  return (
    <div className="employee-dashboard-page hr-theme-page">
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

      {/* 1. Welcome Panel (Compact Dark Navy) */}
      <div className="compact-navy-header">
        <div className="header-meta-group">
          <div className="employee-avatar-box">
            {(user?.name || 'E').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="header-greeting">Welcome back, {user?.name || 'Employee'}</h1>
            <div className="header-emp-meta-row">
              <span className="badge-tag">ID: EMP-{user?.id || '—'}</span>
              <span className="dot-divider">•</span>
              <span>Dept: {data.profile?.department || user?.department || 'General'}</span>
              <span className="dot-divider">•</span>
              <span>{user?.email}</span>
            </div>
            <div className="header-today-status">
              <span>Today's Attendance: </span>
              <strong>
                {todayAtt
                  ? `${todayAtt.status} (In: ${todayAtt.check_in || '—'}${todayAtt.check_out ? `, Out: ${todayAtt.check_out}` : ''})`
                  : 'Not Marked Today'}
              </strong>
            </div>
          </div>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="btn btn-navy-action"
            onClick={scrollToBadge}
            id="btn-emp-my-id-card"
          >
            <CreditCard size={15} />
            <span>My ID Card</span>
          </button>

          <button
            type="button"
            className="btn btn-navy-primary"
            onClick={() => navigate('/employee/attendance')}
          >
            <Clock size={15} />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* Quick Attendance Action Row */}
      <div className="attendance-punch-card">
        <div className="punch-info">
          <Clock size={20} className="text-primary" />
          <div>
            <span className="punch-title">Daily Attendance Punch</span>
            <span className="punch-sub">
              {todayAtt
                ? `Check-in recorded at ${todayAtt.check_in || 'Pending'}. Status: ${todayAtt.status}.`
                : 'Punches are logged directly to the MySQL attendance table.'}
            </span>
          </div>
        </div>
        <div className="punch-buttons">
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={handleCheckIn}
            disabled={isCheckedIn || checkingIn}
            id="btn-emp-quick-checkin"
          >
            <LogIn size={14} />
            <span>{isCheckedIn ? `Checked In (${todayAtt.check_in})` : checkingIn ? 'Recording...' : 'Check In'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-dark"
            onClick={handleCheckOut}
            disabled={!isCheckedIn || isCheckedOut || checkingOut}
            id="btn-emp-quick-checkout"
          >
            <LogOut size={14} />
            <span>{isCheckedOut ? `Checked Out (${todayAtt.check_out})` : checkingOut ? 'Recording...' : 'Check Out'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate('/employee/leaves')}
          >
            <CalendarOff size={14} />
            <span>Apply Leave</span>
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

      {/* 2. Five Summary KPI Cards in Responsive Grid */}
      <div className="kpi-summary-grid-5">
        {/* Card 1: Today's Attendance */}
        <div className="kpi-card" onClick={() => navigate('/employee/attendance')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Today's Attendance</span>
            <div className={`kpi-icon-pill ${todayAtt ? 'green' : 'amber'}`}>
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="kpi-value text-base">
            {todayAtt ? todayAtt.status : 'Not Marked'}
          </div>
          <div className="kpi-footer-meta">
            {todayAtt?.check_in ? `In at ${todayAtt.check_in}` : 'Awaiting check-in'}
          </div>
        </div>

        {/* Card 2: Total Assigned Tasks */}
        <div className="kpi-card" onClick={() => navigate('/employee/tasks')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Total Assigned</span>
            <div className="kpi-icon-pill blue">
              <CheckSquare size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : data.totalTasks}</div>
          <div className="kpi-footer-meta">Assigned by admin</div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div className="kpi-card" onClick={() => navigate('/employee/tasks')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Pending</span>
            <div className="kpi-icon-pill amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : data.pendingTasks}</div>
          <div className="kpi-footer-meta">Awaiting start</div>
        </div>

        {/* Card 4: In Progress */}
        <div className="kpi-card" onClick={() => navigate('/employee/tasks')}>
          <div className="kpi-card-header">
            <span className="kpi-label">In Progress</span>
            <div className="kpi-icon-pill blue">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : data.inProgressTasks}</div>
          <div className="kpi-footer-meta">Under active work</div>
        </div>

        {/* Card 5: Completed */}
        <div className="kpi-card" onClick={() => navigate('/employee/tasks')}>
          <div className="kpi-card-header">
            <span className="kpi-label">Completed</span>
            <div className="kpi-icon-pill green">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : data.completedTasks}</div>
          <div className="kpi-footer-meta">Deliverables finished</div>
        </div>
      </div>

      {/* 3. Two Column Content Layout: My Recent Tasks & My Barcode Badge */}
      <div className="dashboard-data-grid">
        {/* Left Column: My Recent Tasks */}
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">My Recent Tasks</h3>
              <p className="content-card-sub">Assigned tasks and updateable progress states</p>
            </div>
            <button
              type="button"
              className="btn-text-action"
              onClick={() => navigate('/employee/tasks')}
            >
              View All Tasks <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="p-4 text-center text-muted">Loading assigned tasks...</div>
            ) : data.recentTasks.length === 0 ? (
              <div className="clean-empty-state">
                <CheckSquare size={36} className="text-muted mb-2" />
                <p className="text-secondary font-semibold">No tasks assigned yet.</p>
                <span className="text-xs text-muted">New tasks assigned by administrators will appear here.</span>
              </div>
            ) : (
              <table className="hr-compact-table">
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTasks.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex-align-center gap-6">
                          <strong className="text-navy">{t.title}</strong>
                          {t.is_overdue === 1 && (
                            <span className="overdue-micro-badge">
                              <AlertTriangle size={11} /> Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{t.due_date || 'No deadline'}</td>
                      <td>
                        <span className={`priority-tag ${(t.priority || 'medium').toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select-sm"
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: My Attendance Barcode Badge */}
        <div className="content-card" ref={badgeSectionRef}>
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">My Attendance Barcode Badge</h3>
              <p className="content-card-sub">Official digital identity card with Code 128 barcode</p>
            </div>
            <button
              type="button"
              className="btn-text-action"
              onClick={() => setShowIdCardModal(true)}
            >
              <Eye size={14} /> Full View
            </button>
          </div>

          <div className="badge-preview-container">
            <EmployeeBarcodeCard employee={employeeObject} isModal={false} />
          </div>
        </div>
      </div>

      {/* Modal View for ID Card if requested */}
      {showIdCardModal && (
        <EmployeeBarcodeCard
          employee={employeeObject}
          isModal={true}
          onClose={() => setShowIdCardModal(false)}
        />
      )}
    </div>
  );
}
