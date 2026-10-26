import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  DollarSign,
  CheckSquare,
  CalendarCheck,
  Edit2,
  Calendar,
  Clock,
  Briefcase,
} from 'lucide-react';

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="detail-item">
      <div className="flex-align-center gap-6">
        {Icon && <Icon size={14} className="text-muted" />}
        <p className="detail-label">{label}</p>
      </div>
      <p className="detail-value">{value || '—'}</p>
    </div>
  );
}

function formatSalary(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function EmployeeDetails({ employee, onClose, onEdit }) {
  if (!employee) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="detail-name">
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <h2 className="modal-title" id="detail-name">
              Employee Profile #{employee.id}
            </h2>
            <p className="modal-sub">Live record from MySQL <code>employees</code> table</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Profile Header */}
          <div className="detail-header">
            <div className="detail-avatar">{getInitials(employee.name)}</div>
            <div style={{ flex: 1 }}>
              <h3 className="detail-name">{employee.name}</h3>
              <p className="detail-role">{employee.department || 'General'}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span className="detail-dept">
                  <Building size={13} /> {employee.department || 'General Department'}
                </span>
                <span className="badge badge-full">
                  Salary: {formatSalary(employee.salary)}
                </span>
                <span className="id-badge">
                  ID: #{employee.id}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ marginTop: 16 }}>
            <p className="detail-section-title">
              <User size={14} /> Contact & Department Information
            </p>
            <div className="detail-grid">
              <DetailItem label="Full Name" value={employee.name} icon={User} />
              <DetailItem label="Email Address" value={employee.email} icon={Mail} />
              <DetailItem label="Phone Number" value={employee.phone} icon={Phone} />
              <DetailItem label="Department" value={employee.department} icon={Building} />
              <DetailItem label="Annual Salary" value={formatSalary(employee.salary)} icon={DollarSign} />
              <DetailItem label="Database ID" value={`#${employee.id} (Primary Key)`} icon={Briefcase} />
            </div>

            {/* Assigned Tasks from MySQL */}
            <p className="detail-section-title" style={{ marginTop: 24 }}>
              <CheckSquare size={14} /> Assigned Tasks ({employee.tasks ? employee.tasks.length : 0})
            </p>
            {(!employee.tasks || employee.tasks.length === 0) ? (
              <div className="empty-sub-box">
                <p>No active tasks assigned to this employee.</p>
              </div>
            ) : (
              <div className="detail-task-list">
                {employee.tasks.map((task) => (
                  <div key={task.id} className="detail-task-item">
                    <div style={{ flex: 1 }}>
                      <div className="font-semibold text-navy text-sm">{task.title}</div>
                      {task.description && (
                        <div className="text-muted text-xs mt-1">{task.description}</div>
                      )}
                      <div className="text-muted text-xs mt-1">
                        Due: {task.due_date ? task.due_date.split('T')[0] : 'None'} • Priority: {task.priority}
                      </div>
                    </div>
                    <span className={`status-pill ${task.status === 'Completed' ? 'badge-present' : task.status === 'In Progress' ? 'badge-late' : 'badge-absent'}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Attendance History from MySQL */}
            <p className="detail-section-title" style={{ marginTop: 24 }}>
              <CalendarCheck size={14} /> Recent Attendance Log ({employee.attendance ? employee.attendance.length : 0})
            </p>
            {(!employee.attendance || employee.attendance.length === 0) ? (
              <div className="empty-sub-box">
                <p>No attendance logs recorded for this employee yet.</p>
              </div>
            ) : (
              <div className="detail-attendance-list">
                {employee.attendance.map((att) => (
                  <div key={att.id} className="detail-att-item">
                    <div>
                      <span className="font-medium text-sm text-navy">
                        {att.date ? (typeof att.date === 'string' ? att.date.split('T')[0] : att.date) : '—'}
                      </span>
                      <span className="text-muted text-xs ml-3">
                        {att.check_in ? `In: ${att.check_in}` : ''} {att.check_out ? `• Out: ${att.check_out}` : ''}
                      </span>
                    </div>
                    <span className={`status-pill badge-${att.status.toLowerCase()}`}>
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button id="close-detail-btn" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            id="edit-from-detail-btn"
            className="btn btn-primary"
            onClick={() => onEdit(employee)}
          >
            <Edit2 size={16} />
            <span>Edit Employee</span>
          </button>
        </div>
      </div>
    </div>
  );
}
