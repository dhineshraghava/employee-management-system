import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Printer,
  RefreshCw,
  Users,
} from 'lucide-react';
import { getAdminEmployees } from '../../services/api';
import EmployeeBarcodeCard from '../../components/EmployeeBarcodeCard';

export default function AdminBarcodeCards() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [modalEmployee, setModalEmployee] = useState(null);

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
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.barcode && emp.barcode.toLowerCase().includes(q)) ||
        String(emp.id).includes(q);

      const matchesDept =
        departmentFilter === 'ALL' || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="admin-barcode-cards-page hr-theme-page">
      {/* 1. Page Header */}
      <div className="page-header-row no-print">
        <div>
          <h1 className="page-main-title">Employee Barcode Cards</h1>
          <p className="page-sub-title">
            Generate, preview, download, and print employee barcode cards.
          </p>
        </div>

        <div className="page-header-buttons">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchEmployeesList}
            title="Refresh employee records"
            disabled={loading}
            id="btn-refresh-cards"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePrintAll}
            id="btn-print-displayed-cards"
          >
            <Printer size={14} />
            <span>Print Displayed Cards</span>
          </button>
        </div>
      </div>

      {/* 2. Search and Filter Bar */}
      <div className="filter-controls-card no-print">
        <div className="filter-inputs-group">
          {/* Search Field */}
          <div className="search-field-wrapper">
            <Search size={16} className="search-field-icon" />
            <input
              type="text"
              className="filter-text-input"
              placeholder="Search by name, employee ID, department, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="input-search-cards"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="dropdown-filter-wrapper">
            <Filter size={15} className="dropdown-filter-icon" />
            <select
              className="filter-select-input"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              id="select-dept-filter"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matching Cards Count */}
        <div className="filter-count-badge">
          Showing <strong>{filteredEmployees.length}</strong> of {employees.length} employee barcode cards
        </div>
      </div>

      {/* 3. Responsive Barcode Cards Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
      {loading ? (
        <div className="loading-state-box no-print">
          <div className="loading-spinner"></div>
          <p className="mt-2 text-sm text-secondary">Loading employee identity records from database...</p>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="barcode-cards-3col-grid">
          {filteredEmployees.map((emp) => (
            <EmployeeBarcodeCard
              key={emp.id}
              employee={emp}
              isModal={false}
              onViewModal={(e) => setModalEmployee(e)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-box no-print">
          <Users size={44} className="text-muted mb-2" />
          <h3 className="text-base font-bold text-navy">No Matching Employee Cards</h3>
          <p className="text-sm text-muted">Try clearing your search query or choosing another department filter.</p>
        </div>
      )}

      {/* View Modal */}
      {modalEmployee && (
        <EmployeeBarcodeCard
          employee={modalEmployee}
          isModal={true}
          onClose={() => setModalEmployee(null)}
        />
      )}
    </div>
  );
}
