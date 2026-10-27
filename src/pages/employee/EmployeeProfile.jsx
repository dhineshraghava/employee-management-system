import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getEmployeeProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EmployeeBarcodeCard from '../../components/EmployeeBarcodeCard';

function formatSalary(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEmployeeProfile();
      setProfile(res.data);
    } catch (err) {
      console.error('Error loading employee profile:', err);
      setError('Failed to fetch profile details from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="profile-page-container">
      <div className="page-header-row">
        <div className="header-titles">
          <h1 className="page-main-heading">My Profile</h1>
          <p className="page-subheading">
            Personal employment details and account credentials from MySQL <code>employees</code> table.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadProfile} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadProfile}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="table-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading profile details from MySQL...</p>
        </div>
      ) : (
        <div className="profile-card">
          <div className="profile-header-banner">
            <div className="profile-avatar-large">
              {(profile?.name || user?.name || 'E').charAt(0).toUpperCase()}
            </div>
            <div className="profile-titles">
              <h2 className="profile-name">{profile?.name || user?.name}</h2>
              <p className="profile-designation">{profile?.designation || 'Staff Member'}</p>
              <div className="profile-tags">
                <span className="badge badge-present">Active Employee</span>
                <span className="id-badge">Employee ID: #{profile?.id || user?.id}</span>
                <span className="department-pill dept-engineering">
                  <Building size={12} /> {profile?.department || 'General'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="profile-field-box">
              <span className="field-box-label">
                <User size={14} /> Full Name
              </span>
              <p className="field-box-value">{profile?.name}</p>
            </div>

            <div className="profile-field-box">
              <span className="field-box-label">
                <Mail size={14} /> Email Address (Login ID)
              </span>
              <p className="field-box-value">{profile?.email}</p>
            </div>

            <div className="profile-field-box">
              <span className="field-box-label">
                <Phone size={14} /> Phone Number
              </span>
              <p className="field-box-value">{profile?.phone || 'Not provided'}</p>
            </div>

            <div className="profile-field-box">
              <span className="field-box-label">
                <Building size={14} /> Department
              </span>
              <p className="field-box-value">{profile?.department || 'General'}</p>
            </div>

            <div className="profile-field-box">
              <span className="field-box-label">
                <Briefcase size={14} /> Designation
              </span>
              <p className="field-box-value">{profile?.designation || 'Staff Member'}</p>
            </div>

            <div className="profile-field-box">
              <span className="field-box-label">
                <DollarSign size={14} /> Salary
              </span>
              <p className="field-box-value">{formatSalary(profile?.salary)}</p>
            </div>

            <div className="profile-field-box">
              <span className="field-box-label">
                <ShieldCheck size={14} /> Security Role
              </span>
              <p className="field-box-value">Employee (Scoped Portal Access)</p>
            </div>

            <div className="profile-field-box">
              <span className="field-box-label">
                <CheckCircle size={14} /> Account Status
              </span>
              <p className="field-box-value text-success">
                {profile?.is_active === 1 ? 'Active & Verified' : 'Deactivated'}
              </p>
            </div>
          </div>

          {/* Official Barcode ID Badge Card */}
          <div className="profile-barcode-card-section">
            <div className="section-title-row">
              <h3 className="section-subtitle">Official Code 128 Workforce ID Card</h3>
              <p className="section-desc">
                Present this digital badge or printed card to the attendance scanner for daily check-in and check-out.
              </p>
            </div>
            <div className="profile-card-display">
              <EmployeeBarcodeCard employee={profile || user} isModal={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
