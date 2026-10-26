import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  AlertCircle,
  Database,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, loginEmployee, isAuthenticated, isAdmin, isEmployee } = useAuth();

  // Determine active panel based on URL path or state
  const isEmployeePath = location.pathname.includes('/employee');
  const [activeTab, setActiveTab] = useState(isEmployeePath ? 'employee' : 'admin');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) navigate('/admin/dashboard', { replace: true });
      else if (isEmployee) navigate('/employee/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, isEmployee, navigate]);

  // Sync tab with URL if navigated directly
  useEffect(() => {
    if (location.pathname.endsWith('/employee')) {
      setActiveTab('employee');
    } else if (location.pathname.endsWith('/admin')) {
      setActiveTab('admin');
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setFormData({ email: '', password: '' });
  };

  const handleQuickFill = (email, password) => {
    setFormData({ email, password });
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (activeTab === 'admin') {
        await loginAdmin(formData.email.trim(), formData.password);
        navigate('/admin/dashboard');
      } else {
        await loginEmployee(formData.email.trim(), formData.password);
        navigate('/employee/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card-wrapper">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <Building2 size={32} color="#ffffff" />
          </div>
          <h1 className="login-brand-title">StaffPulse EMS</h1>
          <p className="login-brand-tagline">
            Enterprise Employee Management & Workforce Portal
          </p>
        </div>

        {/* Panel Switcher Tabs */}
        <div className="login-tab-switcher">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
            id="tab-admin-login"
          >
            <ShieldCheck size={18} />
            <span>Admin Portal</span>
          </button>

          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
            onClick={() => handleTabChange('employee')}
            id="tab-employee-login"
          >
            <User size={18} />
            <span>Employee Portal</span>
          </button>
        </div>

        {/* Login Form Card */}
        <div className="login-box-card">
          <div className="login-box-header">
            <h2 className="login-box-title">
              {activeTab === 'admin' ? 'Administrator Sign In' : 'Employee Portal Sign In'}
            </h2>
            <p className="login-box-subtitle">
              {activeTab === 'admin'
                ? 'Sign in to access employee directory, attendance controls, and task assignments.'
                : 'Sign in to mark daily attendance, view your assigned tasks, and update your status.'}
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="login-alert-error" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                {activeTab === 'admin' ? 'Admin Email Address' : 'Employee Registered Email'}
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="field-icon" />
                <input
                  type="email"
                  id="login-email"
                  className="form-input"
                  placeholder={activeTab === 'admin' ? 'admin@ems.com' : 'e.g. employee@company.com'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type="password"
                  id="login-password"
                  className="form-input"
                  placeholder="Enter your account password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-login-submit"
              disabled={isSubmitting}
              id="btn-login-submit"
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {activeTab === 'admin' ? 'Admin' : 'Employee'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Testing */}
          <div className="login-demo-helper">
            <p className="demo-helper-title">
              <Sparkles size={14} className="icon-gold" />
              <span>Quick Login Credentials</span>
            </p>
            {activeTab === 'admin' ? (
              <button
                type="button"
                className="btn-demo-badge"
                onClick={() => handleQuickFill('admin@ems.com', 'admin123')}
                id="btn-demo-admin"
              >
                Use Admin: <strong>admin@ems.com</strong> / <strong>admin123</strong>
              </button>
            ) : (
              <button
                type="button"
                className="btn-demo-badge"
                onClick={() => handleQuickFill('roshan@gmail.com', 'employee123')}
                id="btn-demo-employee"
              >
                Use Employee: <strong>roshan@gmail.com</strong> / <strong>employee123</strong>
              </button>
            )}
          </div>
        </div>

        {/* Database Footer Indicator */}
        <div className="login-db-footer">
          <Database size={14} className="text-blue" />
          <span>Connected to MySQL Database: <code>emp_db</code></span>
        </div>
      </div>
    </div>
  );
}
