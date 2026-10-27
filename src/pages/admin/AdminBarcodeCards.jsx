import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Search,
  Filter,
  Printer,
  Download,
  Building2,
  Users,
  Eye,
  RefreshCw,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { getAdminEmployees } from '../../services/api';
import EmployeeBarcodeCard from '../../components/EmployeeBarcodeCard';

export default function AdminBarcodeCards() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployeesList = async () => {
    try {
      setLoading(true);
      const res = await getAdminEmployees();
      if (Array.isArray(res.data)) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch employees for barcode cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  const departments = useMemo(() => {
    const set = new Set();
    employees.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchTerm.trim() ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.barcode && emp.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(emp.id).includes(searchTerm.trim());

      const matchesDept =
        departmentFilter === 'ALL' || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="admin-barcode-cards-page">
      {/* Page Header */}
      <div className="page-header barcode-cards-header no-print">
        <div className="header-title-group">
          <div className="header-icon-badge">
            <CreditCard size={26} className="text-cyan" />
          </div>
          <div>
            <h1 className="page-title">Employee Barcode ID Cards</h1>
            <p className="page-subtitle">
              Manage, preview, download, and print official Code 128 barcode identity badges for company employees.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchEmployeesList}
            title="Refresh list"
            id="btn-refresh-cards"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Sync Records</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintAll}
            id="btn-print-all-cards"
          >
            <Printer size={16} />
            <span>Print Filtered Badges</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-filters-bar no-print">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search employee name, ID, email, or barcode UID (e.g. EMP-1)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="input-search-cards"
          />
        </div>

        <div className="dept-filter-wrapper">
          <Filter size={16} className="filter-icon" />
          <select
            className="form-input dept-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            id="select-dept-filter"
          >
            <option value="ALL">All Departments ({employees.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <div className="loading-state-card no-print">
          <div className="loading-spinner"></div>
          <p>Loading employee identity records from MySQL emp_db...</p>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="barcode-cards-grid">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="badge-card-container">
              <EmployeeBarcodeCard employee={emp} isModal={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-card no-print">
          <Users size={48} className="empty-icon text-muted" />
          <h3>No Employee Records Match Your Query</h3>
          <p>Try modifying your search query or department filter.</p>
        </div>
      )}

      {/* Modal for detailed full card view */}
      {selectedEmployee && (
        <EmployeeBarcodeCard
          employee={selectedEmployee}
          isModal={true}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
