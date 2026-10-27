import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lock,
} from 'lucide-react';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeDetails from '../components/EmployeeDetails';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import EmployeeBarcodeCard from '../components/EmployeeBarcodeCard';
import {
  getAdminEmployees,
  getAdminEmployeeById,
  deleteAdminEmployee,
  resetEmployeePassword,
} from '../services/api';

export default function ViewEmployees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile Details modal state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Barcode Card modal state
  const [barcodeTarget, setBarcodeTarget] = useState(null);

  // Reset Password modal state
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(null);

  // Fetch employees
  const loadEmployees = useCallback(async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminEmployees(query);
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(
        'Failed to fetch employee records from MySQL. Please ensure your backend server is running on port 5000 and connected to emp_db.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadEmployees]);

  const handleViewDetails = async (employee) => {
    try {
      setLoadingDetails(true);
      const res = await getAdminEmployeeById(employee.id);
      setSelectedEmployee(res.data);
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setSelectedEmployee(employee);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteRequest = (employee) => {
    setDeleteTarget(employee);
  };

  const handleConfirmDelete = async (id) => {
    try {
      setIsDeleting(true);
      await deleteAdminEmployee(id);
      setDeleteTarget(null);

      setToastMessage({
        type: 'success',
        text: `Employee #${id} was deleted successfully from MySQL.`,
      });
      setTimeout(() => setToastMessage(null), 4000);

      loadEmployees(searchTerm);
    } catch (err) {
      console.error('Error deleting employee:', err);
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete employee from database.',
      });
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsResetting(true);
      setResetError(null);
      await resetEmployeePassword(resetTarget.id, newPassword);

      setToastMessage({
        type: 'success',
        text: `Login password for ${resetTarget.name} (${resetTarget.email}) updated successfully!`,
      });
      setTimeout(() => setToastMessage(null), 5000);

      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      console.error('Password reset error:', err);
      setResetError(err.response?.data?.message || 'Failed to reset employee password.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="view-employees-page">
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
          <h1 className="page-main-heading">Employee Directory & Accounts</h1>
          <p className="page-subheading">
            Admin registers and manages employee accounts, login Email IDs, and passwords stored in MySQL <code>emp_db</code>.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/employees/add')}
            id="btn-add-employee-top"
          >
            <UserPlus size={18} />
            <span>Register New Employee</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="filter-controls-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-field-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by ID, name, email ID, department, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="input-search-employees"
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear Search"
              title="Clear Search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="controls-right-group">
          <button
            className="btn btn-secondary btn-refresh"
            onClick={() => loadEmployees(searchTerm)}
            disabled={loading}
            title="Refresh Table"
            id="btn-refresh-employees"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error alert if request failed */}
      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => loadEmployees(searchTerm)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Employee Table */}
      <EmployeeTable
        employees={employees}
        loading={loading}
        onDeleteRequest={handleDeleteRequest}
        onViewDetails={handleViewDetails}
        onViewBarcodeCard={(emp) => setBarcodeTarget(emp)}
        onResetPassword={(emp) => {
          setResetTarget(emp);
          setNewPassword('');
          setResetError(null);
        }}
        searchTerm={searchTerm}
      />

      {/* Barcode ID Card Modal */}
      {barcodeTarget && (
        <EmployeeBarcodeCard
          employee={barcodeTarget}
          isModal={true}
          onClose={() => setBarcodeTarget(null)}
        />
      )}

      {/* View Profile Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={(emp) => {
            setSelectedEmployee(null);
            navigate(`/admin/employees/${emp.id}/edit`);
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Reset Employee Password</h2>
              <button
                className="modal-close"
                onClick={() => setResetTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-body">
                <p className="text-sm text-secondary mb-3">
                  Assign a new login password for <strong>{resetTarget.name}</strong> (Email: <code>{resetTarget.email}</code>).
                </p>

                {resetError && (
                  <div className="form-alert-error" role="alert">
                    <AlertCircle size={16} className="alert-icon" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="modal-reset-pwd" className="form-label">
                    New Password <span className="required-star">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      type="password"
                      id="modal-reset-pwd"
                      className="form-input"
                      placeholder="Enter at least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isResetting}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResetTarget(null)}
                  disabled={isResetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isResetting}
                >
                  {isResetting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        employee={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
