import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  DollarSign,
  UserCheck,
  AlertCircle,
  Briefcase,
  KeyRound,
  QrCode,
} from 'lucide-react';

export default function EmployeeTable({
  employees,
  loading,
  onDeleteRequest,
  onViewDetails,
  onResetPassword,
  onViewBarcodeCard,
  searchTerm,
}) {
  const navigate = useNavigate();

  const getDeptColorClass = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('eng') || d.includes('tech') || d.includes('dev')) return 'dept-engineering';
    if (d.includes('market') || d.includes('sales')) return 'dept-marketing';
    if (d.includes('hr') || d.includes('human')) return 'dept-hr';
    if (d.includes('fin') || d.includes('account')) return 'dept-finance';
    if (d.includes('design') || d.includes('creative')) return 'dept-design';
    return 'dept-general';
  };

  const formatSalary = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="table-loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Fetching employees from MySQL database...</p>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-icon-box">
          <AlertCircle size={48} className="empty-icon" />
        </div>
        <h3 className="empty-title">
          {searchTerm ? 'No Matching Employees Found' : 'No Employees Registered in Database'}
        </h3>
        <p className="empty-description">
          {searchTerm
            ? `No records match your search query "${searchTerm}". Try searching with a different name, email, department, or ID.`
            : 'The MySQL table "employees" is currently empty. The administrator can register new employees with their Email ID and Password.'}
        </p>
        <button
          className="btn btn-primary empty-action-btn"
          onClick={() => navigate('/admin/employees/add')}
          id="btn-empty-add-employee"
        >
          <UserCheck size={18} />
          <span>Register First Employee</span>
        </button>
      </div>
    );
  }

  return (
    <div className="table-card-container">
      <div className="table-responsive-wrapper">
        <table className="custom-employee-table" id="employee-table">
          <thead>
            <tr>
              <th className="th-id">ID</th>
              <th className="th-name">Employee & Designation</th>
              <th className="th-email">Email / Login ID</th>
              <th className="th-phone">Phone</th>
              <th className="th-dept">Department</th>
              <th className="th-salary">Salary</th>
              <th className="th-actions text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="employee-row" id={`employee-row-${emp.id}`}>
                <td className="td-id">
                  <span className="id-badge">#{emp.id}</span>
                </td>
                <td className="td-name">
                  <div
                    className="employee-name-cell cursor-pointer"
                    onClick={() => onViewDetails && onViewDetails(emp)}
                    title="Click to view full profile"
                  >
                    <div className="table-avatar">
                      {(emp.name || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-navy hover-underline">{emp.name}</div>
                      <div className="text-muted text-xs">{emp.designation || 'Staff Member'}</div>
                    </div>
                  </div>
                </td>
                <td className="td-email">
                  <div className="cell-with-icon">
                    <Mail size={14} className="cell-muted-icon" />
                    <span className="text-secondary font-mono">{emp.email}</span>
                  </div>
                </td>
                <td className="td-phone">
                  <div className="cell-with-icon">
                    <Phone size={14} className="cell-muted-icon" />
                    <span className="text-secondary">{emp.phone || '—'}</span>
                  </div>
                </td>
                <td className="td-dept">
                  <span className={`department-pill ${getDeptColorClass(emp.department)}`}>
                    <Building size={12} className="inline-icon" />
                    {emp.department || 'General'}
                  </span>
                </td>
                <td className="td-salary">
                  <span className="salary-text">{formatSalary(emp.salary)}</span>
                </td>
                <td className="td-actions text-center">
                  <div className="action-buttons-group">
                    <button
                      className="action-btn badge-btn"
                      onClick={() => onViewBarcodeCard && onViewBarcodeCard(emp)}
                      title={`View Code 128 Barcode ID Card for ${emp.name}`}
                      aria-label={`Barcode Card ${emp.name}`}
                      id={`btn-barcode-${emp.id}`}
                    >
                      <QrCode size={16} />
                      <span className="btn-label">Badge</span>
                    </button>

                    <button
                      className="action-btn view-btn"
                      onClick={() => onViewDetails && onViewDetails(emp)}
                      title={`View Profile for ${emp.name}`}
                      aria-label={`View ${emp.name}`}
                      id={`btn-view-${emp.id}`}
                    >
                      <Eye size={16} />
                      <span className="btn-label">View</span>
                    </button>

                    <button
                      className="action-btn key-btn"
                      onClick={() => onResetPassword && onResetPassword(emp)}
                      title={`Reset Login Password for ${emp.name}`}
                      aria-label={`Reset Password ${emp.name}`}
                      id={`btn-pwd-${emp.id}`}
                    >
                      <KeyRound size={16} />
                      <span className="btn-label">Password</span>
                    </button>

                    <button
                      className="action-btn edit-btn"
                      onClick={() => navigate(`/admin/employees/${emp.id}/edit`)}
                      title={`Edit ${emp.name}`}
                      aria-label={`Edit ${emp.name}`}
                      id={`btn-edit-${emp.id}`}
                    >
                      <Edit2 size={16} />
                      <span className="btn-label">Edit</span>
                    </button>

                    <button
                      className="action-btn delete-btn"
                      onClick={() => onDeleteRequest(emp)}
                      title={`Delete ${emp.name}`}
                      aria-label={`Delete ${emp.name}`}
                      id={`btn-delete-${emp.id}`}
                    >
                      <Trash2 size={16} />
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
          Showing <strong>{employees.length}</strong> {employees.length === 1 ? 'employee' : 'employees'}
        </span>
      </div>
    </div>
  );
}
