import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Database,
  Check,
  X,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forgotPasswordRequest, resetPasswordSubmit } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin, isEmployee } = useAuth();

  // Sign In Form State
  const [formData, setFormData] = useState({
    identifier: localStorage.getItem('ems_remembered_identifier') || '',
    password: '',
    rememberMe: Boolean(localStorage.getItem('ems_remembered_identifier')),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Forgot / Reset Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter code & new pass
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else if (isEmployee) {
        navigate('/employee/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isEmployee, navigate]);

  // Quick fill helper for one-click demo testing
  const handleQuickFill = (identifier, password) => {
    setFormData((prev) => ({
      ...prev,
      identifier,
      password,
    }));
    setErrorMessage(null);
  };

  // Sign In Submission Handler
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.identifier.trim()) {
      setErrorMessage('Please enter your Employee ID or registered email address.');
      return;
    }
    if (!formData.password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(
        formData.identifier.trim(),
        formData.password,
        formData.rememberMe
      );

      // Server determines the actual user role and destination dashboard
      if (result.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Sign in error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password: Step 1 (Request code)
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your account email address.');
      return;
    }

    try {
      setForgotSubmitting(true);
      const res = await forgotPasswordRequest(forgotEmail.trim());
      if (res.data?.success) {
        setForgotResetToken(res.data.resetToken);
        setForgotCode(res.data.resetCode || '');
        setForgotStep(2);
        setForgotSuccess(
          res.data.message || 'Verification code generated! Please enter it below to set a new password.'
        );
      }
    } catch (err) {
      setForgotError(
        err.response?.data?.message || err.message || 'Failed to initiate password reset request.'
      );
    } finally {
      setForgotSubmitting(false);
    }
  };

  // Forgot Password: Step 2 (Submit new password)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPass.length < 6) {
      setForgotError('New password must be at least 6 characters in length.');
      return;
    }

    try {
      setForgotSubmitting(true);
      const res = await resetPasswordSubmit({
        resetToken: forgotResetToken,
        code: forgotCode.trim(),
        newPassword: forgotNewPass,
      });

      if (res.data?.success) {
        setForgotSuccess('Password updated successfully! You can now sign in.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setFormData((prev) => ({
            ...prev,
            identifier: forgotEmail,
            password: forgotNewPass,
          }));
        }, 1500);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Password reset failed.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="login-page-shell">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-header-block">
          <div className="login-logo-badge">
            <Building2 size={30} color="#ffffff" />
          </div>
          <h1 className="login-app-name">Decconz EMS</h1>
          <h2 className="login-form-heading">Sign in to your account</h2>
          <p className="login-form-subtext">
            Enter your registered email address or employee ID to access your dashboard.
          </p>
        </div>

        {/* Authentication Card */}
        <div className="login-form-card">
          {/* Error Banner */}
          {errorMessage && (
            <div className="login-error-alert" role="alert">
              <AlertCircle size={18} className="alert-icon-error" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignInSubmit} className="login-input-form" noValidate>
            {/* Employee ID or Registered Email */}
            <div className="form-field-group">
              <label htmlFor="login-identifier" className="field-label">
                Employee ID or Registered Email
              </label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-prefix-icon" />
                <input
                  type="text"
                  id="login-identifier"
                  className="login-text-input"
                  placeholder="e.g. admin@ems.com or employee@company.com"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  disabled={isSubmitting}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-field-group">
              <div className="label-with-action">
                <label htmlFor="login-password" className="field-label">
                  Password
                </label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setForgotEmail(formData.identifier.includes('@') ? formData.identifier : '');
                    setForgotStep(1);
                    setForgotError(null);
                    setForgotSuccess(null);
                    setShowForgotModal(true);
                  }}
                  id="btn-forgot-password"
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-prefix-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="login-text-input password-input"
                  placeholder="Enter your account password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="remember-me-row">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  id="remember-me-checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">Remember me</span>
              </label>
            </div>

            {/* Single Blue Sign In Button */}
            <button
              type="submit"
              className="btn-signin-primary"
              disabled={isSubmitting}
              id="btn-sign-in"
            >
              {isSubmitting ? (
                <>
                  <div className="signin-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="login-demo-box">
            <span className="demo-box-label">Quick Sign In:</span>
            <div className="demo-buttons-row">
              <button
                type="button"
                className="btn-demo-pill"
                onClick={() => handleQuickFill('admin@ems.com', 'admin123')}
                id="btn-fill-admin-demo"
              >
                <ShieldCheck size={14} className="text-primary-blue" />
                <span>Admin Demo</span>
              </button>
              <button
                type="button"
                className="btn-demo-pill"
                onClick={() => handleQuickFill('roshan@gmail.com', 'employee123')}
                id="btn-fill-employee-demo"
              >
                <User size={14} className="text-secondary-blue" />
                <span>Employee Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Database Indicator */}
        <div className="login-footer-info">
          <Database size={14} className="db-footer-icon" />
          <span>Connected to MySQL Database: <code>emp_db</code></span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop-login" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-box-login"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-top-bar">
              <div className="modal-title-group">
                <KeyRound size={20} className="modal-icon-blue" />
                <h3 className="modal-title-text">Reset Password</h3>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-area">
              {forgotError && (
                <div className="login-error-alert mb-3">
                  <AlertCircle size={16} />
                  <span>{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className="login-success-alert mb-3">
                  <CheckCircle2 size={16} />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="modal-form-flow">
                  <p className="modal-instructions">
                    Enter the email address registered with your Decconz EMS account. We will issue a verification code to reset your password.
                  </p>
                  <div className="form-field-group">
                    <label className="field-label">Email Address</label>
                    <div className="input-icon-wrapper">
                      <Mail size={18} className="input-prefix-icon" />
                      <input
                        type="email"
                        className="login-text-input"
                        placeholder="you@company.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={forgotSubmitting}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="modal-btn-actions">
                    <button
                      type="button"
                      className="btn-modal-back"
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-submit"
                      disabled={forgotSubmitting}
                      id="btn-send-verification-code"
                    >
                      {forgotSubmitting ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="modal-form-flow">
                  <p className="modal-instructions">
                    Enter the 6-digit verification code sent for <strong>{forgotEmail}</strong> and your new password.
                  </p>
                  <div className="form-field-group">
                    <label className="field-label">Verification Code (6 Digits)</label>
                    <div className="input-icon-wrapper">
                      <Check size={18} className="input-prefix-icon" />
                      <input
                        type="text"
                        className="login-text-input"
                        placeholder="e.g. 123456"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        disabled={forgotSubmitting}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">New Password (Min 6 chars)</label>
                    <div className="input-icon-wrapper">
                      <Lock size={18} className="input-prefix-icon" />
                      <input
                        type="password"
                        className="login-text-input"
                        placeholder="Enter new password"
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        disabled={forgotSubmitting}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-btn-actions">
                    <button
                      type="button"
                      className="btn-modal-back"
                      onClick={() => setForgotStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-submit"
                      disabled={forgotSubmitting}
                      id="btn-confirm-password-reset"
                    >
                      {forgotSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
