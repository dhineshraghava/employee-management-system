import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, ArrowLeft, CheckCircle, AlertCircle, KeyRound, Lock } from 'lucide-react';
import EmployeeForm from '../components/EmployeeForm';
import { getAdminEmployeeById, updateAdminEmployee, resetEmployeePassword } from '../services/api';

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Password reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await getAdminEmployeeById(id);
        setInitialData(res.data);
      } catch (err) {
        console.error('Error fetching employee for edit:', err);
        setFetchError(
          err.response?.data?.message || `Employee #${id} could not be found in MySQL database.`
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id]);

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      setSuccessMsg(null);

      const res = await updateAdminEmployee(id, formData);

      if (res.data?.success || res.status === 200) {
        setSuccessMsg('Employee details updated and saved to MySQL successfully!');
        setTimeout(() => {
          navigate('/admin/employees');
        }, 1200);
      }
    } catch (err) {
      console.error('Error updating employee:', err);
      const serverMessage =
        err.response?.data?.message || 'Failed to update employee in MySQL database.';
      setApiError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setResetSubmitting(true);
      setResetError(null);
      await resetEmployeePassword(id, newPassword);
      setSuccessMsg(`Password for ${initialData?.name} was reset successfully in MySQL.`);
      setIsResetOpen(false);
      setNewPassword('');
    } catch (err) {
      console.error('Reset password error:', err);
      setResetError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="form-page-container">
        <div className="table-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading employee details from MySQL database...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="form-page-container">
        <div className="empty-state-card">
          <AlertCircle size={48} className="empty-icon text-danger" />
          <h3 className="empty-title">Employee Record Not Found</h3>
          <p className="empty-description">{fetchError}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/employees')}
          >
            Return to Employee Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-container">
      {/* Top Header */}
      <div className="form-page-header">
        <button
          className="btn-back-link"
          onClick={() => navigate('/admin/employees')}
          id="btn-back-to-employees-edit"
        >
          <ArrowLeft size={16} />
          <span>Back to Employees</span>
        </button>

        <div className="form-title-block flex-between">
          <div>
            <div className="form-title-badge">
              <Edit3 size={20} className="text-purple" />
              <h1 className="form-title">Edit Employee #{id}</h1>
            </div>
            <p className="form-subtitle">
              Update employee details and synchronize changes with your MySQL database.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsResetOpen(true)}
            id="btn-open-reset-pwd"
          >
            <KeyRound size={16} />
            <span>Reset Password</span>
          </button>
        </div>
      </div>

      {/* Success banner if updated */}
      {successMsg && (
        <div className="form-alert-success" role="alert">
          <CheckCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Success:</strong> {successMsg}
          </div>
        </div>
      )}

      {/* Form Component */}
      <EmployeeForm
        initialData={initialData}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        apiError={apiError}
        isEdit={true}
      />

      {/* Reset Password Modal */}
      {isResetOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Reset Employee Password</h2>
              <button
                className="modal-close"
                onClick={() => setIsResetOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <p className="text-sm text-secondary mb-3">
                  Assign a new password for <strong>{initialData?.name}</strong> (#{id}). The employee will use this new password to sign into the Employee Portal.
                </p>

                {resetError && (
                  <div className="form-alert-error" role="alert">
                    <AlertCircle size={16} className="alert-icon" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="new-password" className="form-label">
                    New Password <span className="required-star">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      type="password"
                      id="new-password"
                      className="form-input"
                      placeholder="Enter at least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={resetSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsResetOpen(false)}
                  disabled={resetSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetSubmitting}
                >
                  {resetSubmitting ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
