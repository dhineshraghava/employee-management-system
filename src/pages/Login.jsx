import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Phone,
  Briefcase,
  Layers,
  Key,
  Database,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forgotPasswordRequest, resetPasswordSubmit } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, isAdmin, isEmployee } = useAuth();

  // Active top-level Tab: 'signin' | 'create_account'
  const [activeTab, setActiveTab] = useState('signin');

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    identifier: localStorage.getItem('ems_remembered_identifier') || '',
    password: '',
    rememberMe: Boolean(localStorage.getItem('ems_remembered_identifier')),
  });
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInSubmitting, setSignInSubmitting] = useState(false);
  const [signInError, setSignInError] = useState(null);

  // Create Account Form State
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    employee_id: '',
    phone: '',
    password: '',
    confirmPassword: '',
    account_type: 'employee', // 'employee' | 'admin'
    department: 'Engineering',
    designation: 'Software Engineer',
    admin_secret: '',
    acceptTerms: true,
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);

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

  // Auto redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else if (isEmployee) {
        navigate('/employee/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isEmployee, navigate]);

  // Support direct query param ?tab=register if requested
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'register' || location.pathname.includes('/register')) {
      setActiveTab('create_account');
    }
  }, [location]);

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    const pass = registerData.password;
    if (!pass) return { score: 0, label: 'Too short', color: '#94a3b8' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: '#f59e0b' };
    if (score === 4) return { score: 3, label: 'Strong', color: '#10b981' };
    return { score: 4, label: 'Very Strong', color: '#06b6d4' };
  }, [registerData.password]);

  // Quick fill helper for one-click testing
  const handleQuickFill = (identifier, password) => {
    setSignInData((prev) => ({
      ...prev,
      identifier,
      password,
    }));
    setSignInError(null);
  };

  // Sign In Handler
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setSignInError(null);

    if (!signInData.identifier.trim()) {
      setSignInError('Please enter your registered email address or employee ID.');
      return;
    }
    if (!signInData.password) {
      setSignInError('Please enter your account password.');
      return;
    }

    try {
      setSignInSubmitting(true);
      const result = await login(
        signInData.identifier.trim(),
        signInData.password,
        signInData.rememberMe
      );

      // Server determines actual role and redirect path
      if (result.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Unified login error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.';
      setSignInError(msg);
    } finally {
      setSignInSubmitting(false);
    }
  };

  // Create Account Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    // Validations
    if (!registerData.name.trim()) {
      setRegisterError('Full name is required.');
      return;
    }
    if (!registerData.email.trim()) {
      setRegisterError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email.trim())) {
      setRegisterError('Please enter a valid corporate or personal email address.');
      return;
    }
    if (registerData.password.length < 6) {
      setRegisterError('Password must be at least 6 characters in length.');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match. Please verify your confirmation.');
      return;
    }
    if (registerData.account_type === 'admin' && !registerData.admin_secret.trim()) {
      setRegisterError('An Administrative Setup Security Key is required to create an Administrator account.');
      return;
    }
    if (!registerData.acceptTerms) {
      setRegisterError('You must agree to the StaffPulse Workforce Terms of Service.');
      return;
    }

    try {
      setRegisterSubmitting(true);
      const result = await register({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        employee_id: registerData.employee_id ? registerData.employee_id.trim() : undefined,
        phone: registerData.phone ? registerData.phone.trim() : undefined,
        password: registerData.password,
        account_type: registerData.account_type,
        department: registerData.department,
        designation: registerData.designation,
        admin_secret: registerData.admin_secret.trim(),
      });

      setRegisterSuccess(result.message || 'Account successfully created!');
      
      // Automatic redirection after brief confirmation
      setTimeout(() => {
        if (result.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/employee/dashboard', { replace: true });
        }
      }, 1200);
    } catch (err) {
      console.error('Registration error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your inputs and try again.';
      setRegisterError(msg);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  // Forgot Password Step 1
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

  // Forgot Password Step 2 (Reset)
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
          setSignInData((prev) => ({
            ...prev,
            identifier: forgotEmail,
            password: forgotNewPass,
          }));
          setActiveTab('signin');
        }, 1500);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Password reset failed.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="unified-auth-container">
      {/* Background Animated Ambient Lights */}
      <div className="auth-ambient-glow auth-glow-cyan"></div>
      <div className="auth-ambient-glow auth-glow-blue"></div>
      <div className="auth-ambient-glow auth-glow-indigo"></div>

      {/* Main Centered Authentication Card */}
      <div className="unified-auth-card">
        {/* Futuristic Brand Header */}
        <header className="auth-card-header">
          <div className="auth-brand-badge-row">
            <div className="auth-logo-icon-glow">
              <Building2 size={28} className="auth-logo-svg" />
            </div>
            <div className="auth-brand-text-block">
              <h1 className="auth-brand-title">
                Staff<span>Pulse</span> EMS
              </h1>
              <div className="auth-ai-pill">
                <Sparkles size={12} className="ai-sparkle-spin" />
                <span>AI-Powered Workforce OS</span>
              </div>
            </div>
          </div>
          <p className="auth-brand-description">
            Next-generation workforce management, smart attendance verification, and predictive task analytics.
          </p>
        </header>

        {/* Unified Tab Switcher: Sign In & Create Account */}
        <div className="unified-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'signin'}
            className={`unified-tab-item ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('signin');
              setSignInError(null);
            }}
            id="tab-btn-signin"
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'create_account'}
            className={`unified-tab-item ${activeTab === 'create_account' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create_account');
              setRegisterError(null);
            }}
            id="tab-btn-create-account"
          >
            <UserPlus size={16} />
            <span>Create Account</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: SIGN IN PANEL
            ========================================================================= */}
        {activeTab === 'signin' && (
          <div className="auth-panel-body" key="panel-signin">
            <div className="auth-panel-intro">
              <h2 className="auth-panel-title">Sign In to Workforce Portal</h2>
              <p className="auth-panel-sub">
                Enter your authorized credentials. The system automatically detects your role (Administrator or Employee) and securely opens your dashboard.
              </p>
            </div>

            {/* Error Message Alert */}
            {signInError && (
              <div className="auth-banner-alert error-banner" role="alert">
                <AlertCircle size={18} className="banner-icon-alert" />
                <span>{signInError}</span>
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="unified-auth-form" noValidate>
              {/* Identifier Field: Email or Employee ID */}
              <div className="auth-form-field">
                <label htmlFor="signin-identifier" className="auth-field-label">
                  <span>Registered Email or Employee ID</span>
                  <span className="field-required">*</span>
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-prefix-icon" />
                  <input
                    type="text"
                    id="signin-identifier"
                    className="auth-input-control"
                    placeholder="e.g. employee@ems.com or ID (e.g. 1)"
                    value={signInData.identifier}
                    onChange={(e) =>
                      setSignInData({ ...signInData, identifier: e.target.value })
                    }
                    disabled={signInSubmitting}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-form-field">
                <div className="auth-field-label-row">
                  <label htmlFor="signin-password" className="auth-field-label">
                    <span>Password</span>
                    <span className="field-required">*</span>
                  </label>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => {
                      setForgotEmail(signInData.identifier.includes('@') ? signInData.identifier : '');
                      setForgotStep(1);
                      setForgotError(null);
                      setForgotSuccess(null);
                      setShowForgotModal(true);
                    }}
                    id="btn-forgot-password"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-prefix-icon" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    id="signin-password"
                    className="auth-input-control auth-input-password"
                    placeholder="Enter your security password"
                    value={signInData.password}
                    onChange={(e) =>
                      setSignInData({ ...signInData, password: e.target.value })
                    }
                    disabled={signInSubmitting}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-action-btn"
                    onClick={() => setShowSignInPassword((prev) => !prev)}
                    title={showSignInPassword ? 'Hide password' : 'Show password'}
                    aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="auth-checkbox-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    id="signin-remember-me"
                    checked={signInData.rememberMe}
                    onChange={(e) =>
                      setSignInData({ ...signInData, rememberMe: e.target.checked })
                    }
                    disabled={signInSubmitting}
                  />
                  <span className="checkbox-custom-box"></span>
                  <span className="checkbox-text">Remember my sign-in credentials</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-primary-submit-btn"
                disabled={signInSubmitting}
                id="btn-submit-unified-signin"
              >
                {signInSubmitting ? (
                  <>
                    <div className="auth-btn-spinner"></div>
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div className="auth-demo-section">
              <div className="demo-section-header">
                <Sparkles size={14} className="sparkle-gold" />
                <span>Instant Demo Login Credentials</span>
              </div>
              <div className="demo-credentials-grid">
                <button
                  type="button"
                  className="demo-credential-chip"
                  onClick={() => handleQuickFill('admin@ems.com', 'admin123')}
                  id="btn-fill-admin-demo"
                >
                  <div className="demo-chip-role">
                    <ShieldCheck size={14} />
                    <span>Administrator</span>
                  </div>
                  <div className="demo-chip-user">
                    <span>admin@ems.com</span>
                    <code>admin123</code>
                  </div>
                </button>

                <button
                  type="button"
                  className="demo-credential-chip"
                  onClick={() => handleQuickFill('roshan@gmail.com', 'employee123')}
                  id="btn-fill-employee-demo"
                >
                  <div className="demo-chip-role emp">
                    <User size={14} />
                    <span>Employee</span>
                  </div>
                  <div className="demo-chip-user">
                    <span>roshan@gmail.com</span>
                    <code>employee123</code>
                  </div>
                </button>
              </div>
            </div>

            {/* Switch Tab Prompt */}
            <div className="auth-switch-prompt">
              <span>New to StaffPulse EMS?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setActiveTab('create_account');
                  setSignInError(null);
                }}
                id="link-switch-to-create-account"
              >
                Create an Account
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CREATE ACCOUNT PANEL
            ========================================================================= */}
        {activeTab === 'create_account' && (
          <div className="auth-panel-body" key="panel-create-account">
            <div className="auth-panel-intro">
              <h2 className="auth-panel-title">Create Your Workforce Account</h2>
              <p className="auth-panel-sub">
                Register a new corporate identity. Employee accounts are created directly, while Administrator roles require a valid administrative setup key.
              </p>
            </div>

            {/* Success Alert */}
            {registerSuccess && (
              <div className="auth-banner-alert success-banner" role="status">
                <CheckCircle2 size={18} className="banner-icon-success" />
                <span>{registerSuccess} Redirecting to your dashboard...</span>
              </div>
            )}

            {/* Error Alert */}
            {registerError && (
              <div className="auth-banner-alert error-banner" role="alert">
                <AlertCircle size={18} className="banner-icon-alert" />
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="unified-auth-form" noValidate>
              {/* Account Type Selector (Employee vs Admin) */}
              <div className="auth-form-field">
                <label className="auth-field-label">
                  <span>Account Type</span>
                  <span className="field-required">*</span>
                </label>
                <div className="role-selector-toggle-group">
                  <button
                    type="button"
                    className={`role-toggle-btn ${
                      registerData.account_type === 'employee' ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setRegisterData({ ...registerData, account_type: 'employee' })
                    }
                    id="role-select-employee"
                  >
                    <User size={16} />
                    <span>Employee Account</span>
                  </button>

                  <button
                    type="button"
                    className={`role-toggle-btn ${
                      registerData.account_type === 'admin' ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setRegisterData({ ...registerData, account_type: 'admin' })
                    }
                    id="role-select-admin"
                  >
                    <ShieldCheck size={16} />
                    <span>Administrator Account</span>
                  </button>
                </div>
              </div>

              {/* Full Name & Email Fields in Grid */}
              <div className="auth-grid-2-col">
                <div className="auth-form-field">
                  <label htmlFor="reg-name" className="auth-field-label">
                    <span>Full Name</span>
                    <span className="field-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <User size={18} className="auth-input-prefix-icon" />
                    <input
                      type="text"
                      id="reg-name"
                      className="auth-input-control"
                      placeholder="e.g. Alex Morgan"
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, name: e.target.value })
                      }
                      disabled={registerSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-field">
                  <label htmlFor="reg-email" className="auth-field-label">
                    <span>Email Address</span>
                    <span className="field-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-prefix-icon" />
                    <input
                      type="email"
                      id="reg-email"
                      className="auth-input-control"
                      placeholder="alex@company.com"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, email: e.target.value })
                      }
                      disabled={registerSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Employee ID Fields */}
              <div className="auth-grid-2-col">
                <div className="auth-form-field">
                  <label htmlFor="reg-phone" className="auth-field-label">
                    <span>Phone Number</span>
                    <span className="field-optional">(Optional)</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <Phone size={18} className="auth-input-prefix-icon" />
                    <input
                      type="tel"
                      id="reg-phone"
                      className="auth-input-control"
                      placeholder="+1 (555) 000-0000"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, phone: e.target.value })
                      }
                      disabled={registerSubmitting}
                    />
                  </div>
                </div>

                <div className="auth-form-field">
                  <label htmlFor="reg-emp-id" className="auth-field-label">
                    <span>Employee ID</span>
                    <span className="field-optional">(Optional)</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <Layers size={18} className="auth-input-prefix-icon" />
                    <input
                      type="text"
                      id="reg-emp-id"
                      className="auth-input-control"
                      placeholder="e.g. 104"
                      value={registerData.employee_id}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, employee_id: e.target.value })
                      }
                      disabled={registerSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {registerData.account_type === 'employee' ? (
                <div className="auth-grid-2-col">
                  <div className="auth-form-field">
                    <label htmlFor="reg-dept" className="auth-field-label">
                      <span>Department</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <Briefcase size={18} className="auth-input-prefix-icon" />
                      <select
                        id="reg-dept"
                        className="auth-input-control auth-select-control"
                        value={registerData.department}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, department: e.target.value })
                        }
                        disabled={registerSubmitting}
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-form-field">
                    <label htmlFor="reg-designation" className="auth-field-label">
                      <span>Designation</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <Briefcase size={18} className="auth-input-prefix-icon" />
                      <input
                        type="text"
                        id="reg-designation"
                        className="auth-input-control"
                        placeholder="e.g. Lead Designer"
                        value={registerData.designation}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, designation: e.target.value })
                        }
                        disabled={registerSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Admin Protected Setup Secret */
                <div className="auth-form-field admin-authorization-card">
                  <div className="admin-auth-header">
                    <Key size={16} className="text-cyan" />
                    <span className="admin-auth-title">Administrative Authorization Required</span>
                  </div>
                  <p className="admin-auth-desc">
                    To prevent unauthorized privilege escalation, administrator accounts require a company setup token.
                    (Default token: <code>EMS_ADMIN_2026</code>)
                  </p>
                  <div className="auth-input-wrapper">
                    <KeyRound size={18} className="auth-input-prefix-icon" />
                    <input
                      type="password"
                      id="reg-admin-secret"
                      className="auth-input-control"
                      placeholder="Enter administrative setup token"
                      value={registerData.admin_secret}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, admin_secret: e.target.value })
                      }
                      disabled={registerSubmitting}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="auth-grid-2-col">
                <div className="auth-form-field">
                  <label htmlFor="reg-password" className="auth-field-label">
                    <span>Password</span>
                    <span className="field-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-prefix-icon" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      id="reg-password"
                      className="auth-input-control auth-input-password"
                      placeholder="Min 6 characters"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, password: e.target.value })
                      }
                      disabled={registerSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="auth-input-action-btn"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      title={showRegPassword ? 'Hide password' : 'Show password'}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="auth-form-field">
                  <label htmlFor="reg-confirm-password" className="auth-field-label">
                    <span>Confirm Password</span>
                    <span className="field-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-prefix-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="reg-confirm-password"
                      className="auth-input-control auth-input-password"
                      placeholder="Re-enter password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, confirmPassword: e.target.value })
                      }
                      disabled={registerSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="auth-input-action-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {registerData.password && (
                <div className="password-strength-container">
                  <div className="strength-header">
                    <span className="strength-label">Password Strength:</span>
                    <span
                      className="strength-score-text"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="strength-meter-bar">
                    <div
                      className="strength-meter-fill"
                      style={{
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Terms of Service Checkbox */}
              <div className="auth-checkbox-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    id="reg-terms"
                    checked={registerData.acceptTerms}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, acceptTerms: e.target.checked })
                    }
                    disabled={registerSubmitting}
                  />
                  <span className="checkbox-custom-box"></span>
                  <span className="checkbox-text">
                    I agree to the StaffPulse Workforce Security & Compliance Terms
                  </span>
                </label>
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                className="auth-primary-submit-btn"
                disabled={registerSubmitting}
                id="btn-submit-unified-register"
              >
                {registerSubmitting ? (
                  <>
                    <div className="auth-btn-spinner"></div>
                    <span>Creating Workforce Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create {registerData.account_type === 'admin' ? 'Administrator' : 'Employee'} Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Switch Tab Prompt */}
            <div className="auth-switch-prompt">
              <span>Already have an account?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setActiveTab('signin');
                  setRegisterError(null);
                }}
                id="link-switch-to-signin"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Database Connection Footer */}
        <footer className="auth-card-footer">
          <div className="auth-db-status">
            <Database size={14} className="db-icon-pulse" />
            <span>Connected to MySQL Database: <code>emp_db</code></span>
          </div>
          <div className="auth-security-tag">
            <ShieldCheck size={13} />
            <span>End-to-End Encrypted Session</span>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          FORGOT / RESET PASSWORD MODAL
          ========================================================================= */}
      {showForgotModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div
            className="auth-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <KeyRound size={22} className="modal-header-icon" />
                <h3 className="modal-title">Reset Workforce Password</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {forgotError && (
                <div className="auth-banner-alert error-banner">
                  <AlertCircle size={16} />
                  <span>{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className="auth-banner-alert success-banner">
                  <CheckCircle2 size={16} />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="modal-form">
                  <p className="modal-description">
                    Enter the email address registered with your StaffPulse EMS account. We will issue a secure verification code to reset your password.
                  </p>
                  <div className="auth-form-field">
                    <label className="auth-field-label">Email Address</label>
                    <div className="auth-input-wrapper">
                      <Mail size={18} className="auth-input-prefix-icon" />
                      <input
                        type="email"
                        className="auth-input-control"
                        placeholder="you@company.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={forgotSubmitting}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-modal-cancel"
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-primary"
                      disabled={forgotSubmitting}
                      id="btn-request-reset-code"
                    >
                      {forgotSubmitting ? 'Requesting...' : 'Send Verification Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="modal-form">
                  <p className="modal-description">
                    Enter the 6-digit verification code sent for <strong>{forgotEmail}</strong> and your new password.
                  </p>
                  <div className="auth-form-field">
                    <label className="auth-field-label">Verification Code (6 Digits)</label>
                    <div className="auth-input-wrapper">
                      <Check size={18} className="auth-input-prefix-icon" />
                      <input
                        type="text"
                        className="auth-input-control"
                        placeholder="e.g. 123456"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        disabled={forgotSubmitting}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="auth-form-field">
                    <label className="auth-field-label">New Password (Min 6 chars)</label>
                    <div className="auth-input-wrapper">
                      <Lock size={18} className="auth-input-prefix-icon" />
                      <input
                        type="password"
                        className="auth-input-control"
                        placeholder="Enter new password"
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        disabled={forgotSubmitting}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-modal-cancel"
                      onClick={() => setForgotStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-primary"
                      disabled={forgotSubmitting}
                      id="btn-confirm-reset-password"
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
