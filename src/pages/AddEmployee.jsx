import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Database,
  ExternalLink,
  Users,
  Copy,
  Check,
  KeyRound,
  Mail,
  Lock,
} from 'lucide-react';
import EmployeeForm from '../components/EmployeeForm';
import { createAdminEmployee } from '../services/api';

export default function AddEmployee() {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [registeredData, setRegisteredData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      const res = await createAdminEmployee(formData);

      if (res.data?.success || res.status === 201) {
        setRegisteredData({
          employee: res.data.data,
          initialPassword: formData.password,
          email: formData.email,
          name: formData.name,
        });
      }
    } catch (err) {
      console.error('Error adding employee:', err);
      const serverMessage =
        err.response?.data?.message ||
        'Failed to connect to MySQL backend server. Please verify MySQL service and credentials.';
      setApiError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!registeredData) return;
    const text = `Employee Login Credentials:\nEmail: ${registeredData.email}\nPassword: ${registeredData.initialPassword}\nPortal URL: http://localhost:3000/login/employee`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="form-page-container">
      {/* Top Breadcrumb/Back link */}
      <div className="form-page-header">
        <button
          className="btn-back-link"
          onClick={() => navigate('/admin/employees')}
          id="btn-back-to-employees"
        >
          <ArrowLeft size={16} />
          <span>Back to Employee Management</span>
        </button>

        <div className="form-title-block">
          <div className="form-title-badge">
            <UserPlus size={20} className="text-blue" />
            <h1 className="form-title">Register New Employee Account</h1>
          </div>
          <p className="form-subtitle">
            Admin registers the employee's personal details, Email ID, and initial Password for their Employee Portal access.
          </p>
        </div>
      </div>

      {/* Success Modal / Card after Registration */}
      {registeredData ? (
        <div className="registration-success-card">
          <div className="success-card-header">
            <div className="success-icon-box">
              <CheckCircle2 size={36} color="#16a34a" />
            </div>
            <div>
              <h2 className="success-title">Employee Account Successfully Registered!</h2>
              <p className="success-subtitle">
                The record has been saved to MySQL <code>employees</code> table. The employee can now log in using these credentials.
              </p>
            </div>
          </div>

          <div className="credentials-box">
            <div className="credential-row">
              <span className="credential-label">
                <Users size={15} /> Employee Name:
              </span>
              <span className="credential-value">{registeredData.name} (ID: #{registeredData.employee?.id})</span>
            </div>

            <div className="credential-row">
              <span className="credential-label">
                <Mail size={15} /> Registered Email ID (Username):
              </span>
              <span className="credential-value font-mono highlight">{registeredData.email}</span>
            </div>

            <div className="credential-row">
              <span className="credential-label">
                <Lock size={15} /> Registered Password:
              </span>
              <span className="credential-value font-mono highlight">{registeredData.initialPassword}</span>
            </div>
          </div>

          <div className="success-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyCredentials}
              id="btn-copy-credentials"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
            </button>

            <a
              href="/login/employee"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark"
              id="btn-open-employee-portal"
            >
              <ExternalLink size={16} />
              <span>Test Employee Login</span>
            </a>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/admin/employees')}
              id="btn-go-to-directory"
            >
              <Users size={16} />
              <span>Go to Employee Directory</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRegisteredData(null)}
              id="btn-register-another"
            >
              <UserPlus size={16} />
              <span>Register Another Employee</span>
            </button>
          </div>
        </div>
      ) : (
        <EmployeeForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          apiError={apiError}
          isEdit={false}
        />
      )}
    </div>
  );
}
