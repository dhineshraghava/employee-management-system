import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import { getEmployeeTasks, updateEmployeeTaskStatus } from '../../services/api';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const res = await getEmployeeTasks(params);
      setTasks(res.data || []);
    } catch (err) {
      console.error('Error loading employee tasks:', err);
      setError('Failed to fetch assigned tasks from MySQL.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateEmployeeTaskStatus(taskId, newStatus);
      showToast('success', `Task marked as "${newStatus}".`);
      loadTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      showToast('error', err.response?.data?.message || 'Failed to update task status.');
    }
  };

  // Filter tasks by search term
  const filteredTasks = tasks.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(term)) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  });

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'priority-urgent';
      case 'High':
        return 'priority-high';
      case 'Medium':
        return 'priority-medium';
      case 'Low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-present';
      case 'In Progress':
        return 'badge-late';
      case 'Pending':
        return 'badge-absent';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="tasks-page">
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
          <h1 className="page-main-heading">My Assigned Tasks</h1>
          <p className="page-subheading">
            Review deliverables and update progress status. Only tasks assigned to you are displayed.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadTasks} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <div className="tasks-filter-row">
          <div className="search-input-wrapper">
            <Search size={18} className="search-field-icon" />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search in your tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-item">
            <select
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
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadTasks}>
            Retry
          </button>
        </div>
      )}

      {/* Tasks Table */}
      {loading ? (
        <div className="table-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your tasks from MySQL database...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <CheckSquare size={48} className="empty-icon" />
          </div>
          <h3 className="empty-title">No Assigned Tasks Found</h3>
          <p className="empty-description">
            {searchTerm || filterStatus
              ? 'No tasks match your selected filter criteria.'
              : 'You have completed all your deliverables, or no new tasks have been assigned by the administrator yet.'}
          </p>
        </div>
      ) : (
        <div className="table-card-container">
          <div className="table-responsive-wrapper">
            <table className="custom-employee-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Task Deliverable</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status (Click to update)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <span className="id-badge">#{task.id}</span>
                    </td>
                    <td>
                      <div>
                        <div className="font-semibold text-navy flex-align-center gap-6">
                          {task.title}
                          {task.is_overdue === 1 && (
                            <span className="overdue-tag">
                              <AlertTriangle size={12} /> Overdue
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <div className="text-muted text-xs line-clamp-1 mt-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`priority-pill ${getPriorityClass(task.priority)}`}>
                        {task.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Calendar size={14} className="cell-muted-icon" />
                        <span className={task.is_overdue === 1 ? 'text-red font-semibold' : 'text-secondary'}>
                          {task.due_date || 'No deadline'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <select
                        className={`status-select ${getStatusClass(task.status)}`}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        title="Update your task progress status"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer-summary">
            <span>
              Showing <strong>{filteredTasks.length}</strong> assigned task(s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
