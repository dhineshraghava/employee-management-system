import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  PlusCircle,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getEmployees,
} from '../services/api';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    due_date: '',
  });

  // Load tasks with filters
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filterEmployeeId) params.employee_id = filterEmployeeId;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (searchTerm) params.search = searchTerm;

      const res = await getTasks(params);
      setTasks(res.data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to fetch tasks from MySQL database.');
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId, filterStatus, filterPriority, searchTerm]);

  // Load employees list for dropdown
  useEffect(() => {
    getEmployees()
      .then((res) => {
        setEmployees(res.data || []);
      })
      .catch((err) => {
        console.error('Error fetching employees for task dropdown:', err);
      });
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      employee_id: employees.length > 0 ? employees[0].id : '',
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      employee_id: task.employee_id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'Medium',
      due_date: task.due_date || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id) {
      setFormError('Please assign this task to an employee.');
      return;
    }
    if (!formData.title || !formData.title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingTask) {
        await updateTask(editingTask.id, formData);
        showToast('success', `Task #${editingTask.id} updated successfully.`);
      } else {
        await createTask(formData);
        showToast('success', 'New task created and assigned in MySQL.');
      }

      setIsModalOpen(false);
      loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      setFormError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusQuickChange = async (task, newStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
      showToast('success', `Task #${task.id} marked as "${newStatus}".`);
      loadTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      showToast('error', 'Failed to update task status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteTask(deleteTarget.id);
      showToast('success', `Task #${deleteTarget.id} deleted successfully.`);
      setDeleteTarget(null);
      loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('error', err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute metrics
  const totalTasks = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const overdueCount = tasks.filter((t) => t.is_overdue).length;

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
          <button
            className="toast-close-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss Notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div className="header-titles">
          <h1 className="page-main-heading">Task Management</h1>
          <p className="page-subheading">
            Assign, track, and monitor employee project tasks stored in MySQL <code>tasks</code> table.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={openAddModal}
            id="btn-create-task"
          >
            <PlusCircle size={18} />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-cards-grid">
        <div className="stat-card stat-blue">
          <div className="stat-card-icon-box">
            <CheckSquare size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Tasks</span>
            <h2 className="stat-card-value">{totalTasks}</h2>
            <span className="stat-card-meta">Assigned across team</span>
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-card-icon-box">
            <Clock size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Pending</span>
            <h2 className="stat-card-value">{pendingCount}</h2>
            <span className="stat-card-meta">Awaiting start</span>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-card-icon-box">
            <Flag size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">In Progress</span>
            <h2 className="stat-card-value">{inProgressCount}</h2>
            <span className="stat-card-meta">Actively being worked</span>
          </div>
        </div>

        <div className="stat-card stat-teal">
          <div className="stat-card-icon-box">
            <CheckCircle size={24} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Completed</span>
            <h2 className="stat-card-value">{completedCount}</h2>
            <span className="stat-card-meta">Finished deliverables</span>
          </div>
        </div>

        {overdueCount > 0 && (
          <div className="stat-card stat-red">
            <div className="stat-card-icon-box">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-label">Overdue Tasks</span>
              <h2 className="stat-card-value">{overdueCount}</h2>
              <span className="stat-card-meta">Past due date!</span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="filter-controls-card">
        <div className="tasks-filter-row">
          <div className="search-input-wrapper">
            <Search size={18} className="search-field-icon" />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search tasks by title, description or employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear Search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-item">
            <select
              className="form-input form-select"
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
            >
              <option value="">All Assignees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department || 'General'})
                </option>
              ))}
            </select>
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

          <div className="filter-item">
            <select
              className="form-input form-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((pr) => (
                <option key={pr} value={pr}>
                  {pr} Priority
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary btn-refresh"
            onClick={loadTasks}
            disabled={loading}
            title="Refresh Tasks"
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
          <button className="btn btn-sm btn-secondary" onClick={loadTasks}>
            Retry
          </button>
        </div>
      )}

      {/* Tasks Table */}
      {loading ? (
        <div className="table-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading tasks from MySQL database...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-box">
            <CheckSquare size={48} className="empty-icon" />
          </div>
          <h3 className="empty-title">No Tasks Found</h3>
          <p className="empty-description">
            {searchTerm || filterEmployeeId || filterStatus || filterPriority
              ? 'No tasks match your current filter criteria.'
              : 'The MySQL "tasks" table is currently empty. Assign your first task to an employee.'}
          </p>
          <button className="btn btn-primary empty-action-btn" onClick={openAddModal}>
            <PlusCircle size={18} />
            <span>Assign First Task</span>
          </button>
        </div>
      ) : (
        <div className="table-card-container">
          <div className="table-responsive-wrapper">
            <table className="custom-employee-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Task Title & Details</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
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
                      <div className="employee-name-cell">
                        <div className="table-avatar sm">
                          {(task.employee_name || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-navy">{task.employee_name}</div>
                          <div className="text-muted text-xs">
                            {task.employee_department || 'General'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-pill ${getPriorityClass(task.priority)}`}>
                        {task.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <select
                        className={`status-select ${getStatusClass(task.status)}`}
                        value={task.status}
                        onChange={(e) => handleStatusQuickChange(task, e.target.value)}
                        title="Click to quickly change status"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Calendar size={14} className="cell-muted-icon" />
                        <span className={task.is_overdue === 1 ? 'text-red font-semibold' : 'text-secondary'}>
                          {task.due_date || 'No deadline'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="action-buttons-group">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(task)}
                          title="Edit Task"
                        >
                          <Edit3 size={15} />
                          <span className="btn-label">Edit</span>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => setDeleteTarget(task)}
                          title="Delete Task"
                        >
                          <Trash2 size={15} />
                          <span className="btn-label">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer-summary">
            <span>
              Showing <strong>{tasks.length}</strong> task(s)
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-md">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTask ? `Edit Task #${editingTask.id}` : 'Assign New Task'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="form-alert-error" role="alert">
                    <AlertCircle size={18} className="alert-icon" />
                    <div className="alert-content">{formError}</div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="task-title" className="form-label">
                    Task Title <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="task-title"
                    className="form-input"
                    placeholder="e.g. Implement MySQL foreign key constraints"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-desc" className="form-label">
                    Description & Deliverables
                  </label>
                  <textarea
                    id="task-desc"
                    className="form-input"
                    rows="3"
                    placeholder="Provide details about requirements, expected results, and deliverables..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-assignee" className="form-label">
                    Assign To Employee <span className="required-star">*</span>
                  </label>
                  <select
                    id="task-assignee"
                    className="form-input form-select"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select an employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        #{emp.id} - {emp.name} ({emp.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label htmlFor="task-status" className="form-label">
                      Status
                    </label>
                    <select
                      id="task-status"
                      className="form-input form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={isSubmitting}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-priority" className="form-label">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      className="form-input form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      disabled={isSubmitting}
                    >
                      {PRIORITY_OPTIONS.map((pr) => (
                        <option key={pr} value={pr}>
                          {pr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-due-date" className="form-label">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="task-due-date"
                      className="form-input"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving to MySQL...' : editingTask ? 'Update Task' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Task Deletion</h2>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete task #{deleteTarget.id}{' '}
                <strong>"{deleteTarget.title}"</strong> assigned to{' '}
                <strong>{deleteTarget.employee_name}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
