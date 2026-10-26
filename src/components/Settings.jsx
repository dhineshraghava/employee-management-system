import { useState } from 'react';
import { Trash2, Download, RefreshCw, Shield, Database, Bell } from 'lucide-react';

export default function Settings({ employees, onClearData, onAddEmployee }) {
  const [cleared, setCleared] = useState(false);

  const handleExport = () => {
    const json = JSON.stringify(employees, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-fade">
      <div
        className="section-header"
        style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--gray-200)' }}
      >
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-sub">Manage application preferences and data</p>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h2 className="settings-title">
          <Database size={16} style={{ display: 'inline', marginRight: 8 }} />
          Data Management
        </h2>
        <p className="settings-sub">
          Manage your employee records stored in the SQLite database (`employees.sqlite`).
        </p>

        <div className="settings-row">
          <div>
            <p className="settings-row-label">Total Records</p>
            <p className="settings-row-sub">
              {employees.length} employee(s) in database (
              {employees.filter((e) => e.isDemo).length} demo)
            </p>
          </div>
          <span
            style={{
              background: 'var(--blue-pale)',
              color: 'var(--blue-accent)',
              padding: '6px 16px',
              borderRadius: 20,
              fontWeight: 700,
              fontSize: '1.1rem',
            }}
          >
            {employees.length}
          </span>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row-label">Export Data</p>
            <p className="settings-row-sub">
              Download all employee records as a JSON file
            </p>
          </div>
          <button
            id="export-data-btn"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={employees.length === 0}
          >
            <Download size={15} /> Export JSON
          </button>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row-label">Clear All Data</p>
            <p className="settings-row-sub" style={{ color: 'var(--danger)' }}>
              ⚠️ Permanently deletes all records from LocalStorage
            </p>
          </div>
          <button
            id="clear-data-btn"
            className="btn btn-danger"
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure? This will permanently delete ALL employee records!'
                )
              ) {
                onClearData();
                setCleared(true);
              }
            }}
          >
            <Trash2 size={15} /> Clear All
          </button>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h2 className="settings-title">
          <Shield size={16} style={{ display: 'inline', marginRight: 8 }} />
          About Application
        </h2>
        <p className="settings-sub">Application information and version details</p>

        <div className="settings-row">
          <div>
            <p className="settings-row-label">Application</p>
            <p className="settings-row-sub">Employee Enrollment Management System</p>
          </div>
          <span className="chip">v1.0.0</span>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row-label">Technology Stack</p>
            <p className="settings-row-sub">React 19 + Express.js + SQLite</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="chip">React</span>
            <span className="chip">Express</span>
            <span className="chip">SQLite</span>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row-label">Database Storage</p>
            <p className="settings-row-sub">Persistent SQLite file (`employees.sqlite`) with LocalStorage sync</p>
          </div>
          <span className="chip" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
            SQLite DB
          </span>
        </div>
      </div>
    </div>
  );
}
