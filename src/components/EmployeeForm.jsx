import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  DollarSign,
  Save,
  X,
  AlertCircle,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
} from 'lucide-react';

const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Human Resources',
  'Finance',
  'Design',
  'Sales',
  'Operations',
  'Customer Support',
  'Legal',
];

export default function EmployeeForm({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  apiError = null,
  isEdit = false,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    salary: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        department: initialData.department || 'Engineering',
        designation: initialData.designation || 'Software Engineer',
        salary: initialData.salary !== undefined ? String(initialData.salary) : '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [initialData]);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      password: pwd,
      confirmPassword: pwd,
    }));
    setShowPassword(true);
    if (errors.password || errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, password: null, confirmPassword: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Employee name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Employee Email ID is required for account login.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email format (e.g., employee@company.com).';
    }

    if (formData.phone && formData.phone.trim().length > 15) {
      errs.phone = 'Phone number cannot exceed 15 digits.';
    }

    if (!formData.designation.trim()) {
      errs.designation = 'Designation/Job Title is required.';
    }

    if (formData.salary === '' || formData.salary === null) {
      errs.salary = 'Salary is required.';
    } else {
      const num = parseFloat(formData.salary);
      if (isNaN(num) || num < 0) {
        errs.salary = 'Please enter a valid positive salary amount.';
      }
    }

    // In registration mode, password is required!
    if (!isEdit) {
      if (!formData.password || formData.password.length < 6) {
        errs.password = 'Login password is required (minimum 6 characters).';
      }
      if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      department: formData.department.trim(),
      designation: formData.designation.trim(),
      salary: parseFloat(formData.salary) || 0,
    };

    if (!isEdit) {
      payload.password = formData.password.trim();
    }

    onSubmit(payload);
  };

  return (
    <form className="employee-form-card" onSubmit={handleSubmit} noValidate>
      {/* API Error Alert Banner */}
      {apiError && (
        <div className="form-alert-error" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Registration Error:</strong> {apiError}
          </div>
        </div>
      )}

      {/* SECTION 1: Personal & Position Details */}
      <div className="form-section-heading">
        <User size={18} className="text-blue" />
        <span>Employee Details</span>
      </div>

      <div className="form-grid">
        {/* Full Name */}
        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
          <label htmlFor="name" className="form-label">
            Full Name <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <User size={18} className="field-icon" />
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              placeholder="e.g. Priya Sharma"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="name"
              required
            />
          </div>
          {errors.name && <span className="field-error-msg">{errors.name}</span>}
        </div>

        {/* Designation */}
        <div className={`form-group ${errors.designation ? 'has-error' : ''}`}>
          <label htmlFor="designation" className="form-label">
            Designation / Role Title <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Briefcase size={18} className="field-icon" />
            <input
              type="text"
              id="designation"
              name="designation"
              className="form-input"
              placeholder="e.g. Senior Software Engineer"
              value={formData.designation}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
          </div>
          {errors.designation && <span className="field-error-msg">{errors.designation}</span>}
        </div>

        {/* Department */}
        <div className="form-group">
          <label htmlFor="department" className="form-label">
            Department <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Building size={18} className="field-icon" />
            <select
              id="department"
              name="department"
              className="form-input form-select"
              value={formData.department}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Phone */}
        <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <div className="input-with-icon">
            <Phone size={18} className="field-icon" />
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="tel"
            />
          </div>
          {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
        </div>

        {/* Salary */}
        <div className={`form-group ${errors.salary ? 'has-error' : ''}`}>
          <label htmlFor="salary" className="form-label">
            Annual Salary (USD / Local) <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <DollarSign size={18} className="field-icon" />
            <input
              type="number"
              id="salary"
              name="salary"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="e.g. 75000.00"
              value={formData.salary}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          {errors.salary && <span className="field-error-msg">{errors.salary}</span>}
        </div>
      </div>

      {/* SECTION 2: Portal Login Credentials (Email ID & Password) */}
      <div className="form-section-heading mt-6">
        <KeyRound size={18} className="text-purple" />
        <span>Employee Portal Login Credentials</span>
      </div>

      <div className="form-grid">
        {/* Email Address (Login ID) */}
        <div className={`form-group full-width ${errors.email ? 'has-error' : ''}`}>
          <label htmlFor="email" className="form-label">
            Employee Email ID (Login Username) <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <Mail size={18} className="field-icon" />
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="e.g. priya.sharma@company.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>
          {errors.email && <span className="field-error-msg">{errors.email}</span>}
          <span className="field-hint">
            The employee will use this Email ID to sign into their Employee Portal. Must be unique in MySQL.
          </span>
        </div>

        {/* Initial Password (Required in Add/Register Mode) */}
        {!isEdit && (
          <>
            <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
              <div className="flex-between mb-1">
                <label htmlFor="password" className="form-label">
                  Login Password <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={generateRandomPassword}
                  title="Generate a random secure password"
                >
                  <Sparkles size={13} />
                  <span>Generate Password</span>
                </button>
              </div>

              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Set login password (min 6 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="field-error-msg">{errors.password}</span>}
            </div>

            <div className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter password to verify"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <span className="field-error-msg">{errors.confirmPassword}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="form-actions-bar">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/admin/employees')}
          disabled={isSubmitting}
          id="btn-form-cancel"
        >
          <X size={18} />
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          id="btn-form-submit"
        >
          {isSubmitting ? (
            <>
              <div className="btn-spinner"></div>
              <span>Registering in MySQL...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>{isEdit ? 'Save Employee Updates' : 'Register Employee Account'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
