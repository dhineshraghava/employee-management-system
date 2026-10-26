import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Building,
  TrendingUp,
  CalendarCheck,
  CheckSquare,
  DollarSign,
  Printer,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react';
import { getAdminReports } from '../../services/api';

function formatCurrency(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminReports();
      setReports(res.data);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to generate analytical reports from MySQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-page-container">
      {/* Page Header */}
      <div className="page-header-row no-print">
        <div className="header-titles">
          <h1 className="page-main-heading">Workforce Reports & Analytics</h1>
          <p className="page-subheading">
            Executive summaries, departmental payroll distribution, attendance rate trends, and task delivery performance.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadReports} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadReports}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="table-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Generating real-time reports from MySQL database...</p>
        </div>
      ) : (
        <div className="reports-grid">
          {/* Department Payroll & Headcount Report */}
          <div className="dashboard-section-card full-width">
            <div className="section-card-header">
              <div className="header-title-box">
                <Building size={20} className="text-blue" />
                <h3>Departmental Headcount & Payroll Allocation</h3>
              </div>
              <span className="section-badge">emp_db • employees</span>
            </div>
            <div className="section-card-body">
              <div className="table-responsive-wrapper">
                <table className="custom-employee-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Headcount</th>
                      <th>Total Payroll</th>
                      <th>Average Salary</th>
                      <th>Salary Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports?.departments?.map((d) => (
                      <tr key={d.department}>
                        <td>
                          <span className="font-semibold text-navy">{d.department}</span>
                        </td>
                        <td>
                          <span className="id-badge">{d.total_employees} staff</span>
                        </td>
                        <td>
                          <span className="font-semibold">{formatCurrency(d.total_payroll)}</span>
                        </td>
                        <td>{formatCurrency(d.avg_salary)}</td>
                        <td>
                          <span className="text-secondary text-sm">
                            {formatCurrency(d.min_salary)} – {formatCurrency(d.max_salary)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Employee Task Delivery Performance */}
          <div className="dashboard-section-card full-width">
            <div className="section-card-header">
              <div className="header-title-box">
                <CheckSquare size={20} className="text-purple" />
                <h3>Employee Deliverable Performance Leaderboard</h3>
              </div>
              <span className="section-badge">emp_db • tasks</span>
            </div>
            <div className="section-card-body">
              <div className="table-responsive-wrapper">
                <table className="custom-employee-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Assigned Tasks</th>
                      <th>Completed</th>
                      <th>Overdue</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports?.employeePerformance?.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <span className="font-semibold text-navy">#{emp.id} - {emp.name}</span>
                        </td>
                        <td>
                          <span className="department-pill dept-engineering">{emp.department || 'General'}</span>
                        </td>
                        <td>{emp.total_tasks}</td>
                        <td>
                          <span className="text-success font-semibold">{emp.completed_tasks}</span>
                        </td>
                        <td>
                          <span className={emp.overdue_tasks > 0 ? 'text-red font-semibold' : 'text-secondary'}>
                            {emp.overdue_tasks}
                          </span>
                        </td>
                        <td>
                          <div className="flex-align-center gap-6">
                            <div className="progress-bar-track" style={{ width: 120 }}>
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${emp.completion_rate || 0}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold text-sm">{emp.completion_rate || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Attendance Trend Summary */}
          <div className="dashboard-section-card full-width">
            <div className="section-card-header">
              <div className="header-title-box">
                <CalendarCheck size={20} className="text-teal" />
                <h3>Recent Attendance Activity Trend (Last 14 Days)</h3>
              </div>
              <span className="section-badge">emp_db • attendance</span>
            </div>
            <div className="section-card-body">
              <div className="table-responsive-wrapper">
                <table className="custom-employee-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Marked</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent</th>
                      <th>Leave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports?.attendanceTrends?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No attendance records found in selected range.
                        </td>
                      </tr>
                    ) : (
                      reports?.attendanceTrends?.map((row) => (
                        <tr key={row.date}>
                          <td>
                            <span className="font-semibold">{row.date}</span>
                          </td>
                          <td>
                            <span className="id-badge">{row.total_records} records</span>
                          </td>
                          <td>
                            <span className="status-pill badge-present">{row.present} Present</span>
                          </td>
                          <td>
                            <span className="status-pill badge-late">{row.late} Late</span>
                          </td>
                          <td>
                            <span className="status-pill badge-absent">{row.absent} Absent</span>
                          </td>
                          <td>
                            <span className="status-pill badge-leave">{row.leave} Leave</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
