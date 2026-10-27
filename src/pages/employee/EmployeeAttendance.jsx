import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  getEmployeeAttendance,
  employeeCheckIn,
  employeeCheckOut,
} from '../../services/api';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Leave'];

export default function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Action buttons loading state
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const res = await getEmployeeAttendance(params);
      setRecords(res.data || []);
    } catch (err) {
      console.error('Error loading attendance records:', err);
      setError('Failed to fetch your attendance records from MySQL.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await employeeCheckIn();
      showToast('success', res.data?.message || 'Check-in recorded successfully!');
      loadAttendance();
    } catch (err) {
      console.error('Check-in error:', err);
      showToast('error', err.response?.data?.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await employeeCheckOut();
      showToast('success', res.data?.message || 'Check-out recorded successfully!');
      loadAttendance();
    } catch (err) {
      console.error('Check-out error:', err);
      showToast('error', err.response?.data?.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Find today's record
  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayRecord = records.find((r) => r.date === todayStr);

  const isCheckedIn = Boolean(todayRecord && todayRecord.check_in);
  const isCheckedOut = Boolean(todayRecord && todayRecord.check_out);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present':
        return 'badge-present';
      case 'Absent':
        return 'badge-absent';
      case 'Late':
        return 'badge-late';
      case 'Leave':
        return 'badge-leave';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="attendance-page">
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
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div className="header-titles">
          <h1 className="page-main-heading">Mark Attendance & History</h1>
          <p className="page-subheading">
            Record your daily arrival and departure times. Stored in MySQL <code>attendance</code> table.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-teal"
            onClick={handleCheckIn}
            disabled={isCheckedIn || actionLoading}
            id="btn-emp-checkin-header"
          >
            <LogIn size={18} />
            <span>{isCheckedIn ? 'Checked In' : 'Check In'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCheckOut}
            disabled={!isCheckedIn || isCheckedOut || actionLoading}
            id="btn-emp-checkout-header"
          >
            <LogOut size={18} />
            <span>{isCheckedOut ? 'Checked Out' : 'Check Out'}</span>
          </button>
        </div>
      </div>

      {/* Today's Status Banner Card */}
      <div className="emp-attendance-action-card">
        <div className="attendance-action-info">
          <div className="clock-icon-box">
            <Clock size={28} className="text-teal" />
          </div>
          <div>
            <h3 className="attendance-action-title">Today: {todayStr}</h3>
            <p className="attendance-action-sub">
              {todayRecord ? (
                <span>
                  Status: <strong>{todayRecord.status}</strong> • Check-In:{' '}
                  <strong>{todayRecord.check_in || 'Pending'}</strong> • Check-Out:{' '}
                  <strong>{todayRecord.check_out || 'Pending'}</strong>
                </span>
              ) : (
                'You have not marked attendance yet today. Click Check In above.'
              )}
            </p>
          </div>
        </div>

        <div>
          {todayRecord ? (
            <span className={`status-pill ${getStatusBadgeClass(todayRecord.status)}`}>
              {todayRecord.status} Today
            </span>
          ) : (
            <span className="status-pill badge-secondary">Pending Check-in</span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <div className="attendance-filter-row">
          <div className="filter-item">
            <label htmlFor="filter-emp-att-status" className="filter-label">Filter by Status:</label>
            <select
              id="filter-emp-att-status"
              className="form-input form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-emp-att-date" className="filter-label">Filter by Date:</label>
            <input
              type="date"
              id="filter-emp-att-date"
              className="form-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {(filterStatus || filterDate) && (
            <button
              className="btn btn-secondary btn-clear-filters"
              onClick={() => {
                setFilterStatus('');
                setFilterDate('');
              }}
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-refresh"
            onClick={loadAttendance}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadAttendance}>
            Retry
          </button>
        </div>
      )}

      {/* Records Table */}
      {loading ? (
        <div className="table-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading attendance records from MySQL...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <CalendarCheck size={48} className="empty-icon" />
          </div>
          <h3 className="empty-title">No Attendance Records Found</h3>
          <p className="empty-description">
            {filterStatus || filterDate
              ? 'No attendance records match the selected filter criteria.'
              : 'You have not marked attendance yet. Use the Check In button to record today\'s attendance.'}
          </p>
        </div>
      ) : (
        <div className="table-card-container">
          <div className="table-responsive-wrapper">
            <table className="custom-employee-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <span className="id-badge">#{rec.id}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-navy">{rec.date}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusBadgeClass(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary">{rec.check_in || '—'}</span>
                    </td>
                    <td>
                      <span className="text-secondary">{rec.check_out || '—'}</span>
                    </td>
                    <td>
                      {rec.working_duration ? (
                        <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                          {rec.working_duration}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-secondary text-sm">{rec.notes || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer-summary">
            <span>
              Showing <strong>{records.length}</strong> attendance record(s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
