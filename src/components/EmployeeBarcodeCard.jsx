import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Building2,
  Printer,
  Download,
  ShieldCheck,
  Sparkles,
  QrCode,
  User,
  Mail,
  Briefcase,
  Layers,
  X,
} from 'lucide-react';

export default function EmployeeBarcodeCard({ employee, onClose, isModal = false }) {
  const canvasRef = useRef(null);

  const barcodeValue = employee?.barcode || (employee?.id ? `EMP-${employee.id}` : 'EMP-000');
  const employeeName = employee?.name || 'Staff Member';
  const employeeRole = employee?.designation || 'Specialist';
  const department = employee?.department || 'Operations';
  const email = employee?.email || 'staff@ems.com';
  const employeeId = employee?.id || '---';

  useEffect(() => {
    if (canvasRef.current && barcodeValue) {
      try {
        JsBarcode(canvasRef.current, barcodeValue, {
          format: 'CODE128',
          lineColor: '#090d16',
          width: 2.3,
          height: 60,
          displayValue: true,
          font: 'monospace',
          fontSize: 15,
          fontOptions: 'bold',
          textMargin: 6,
          background: '#ffffff',
          margin: 10,
        });
      } catch (err) {
        console.error('Failed to generate Code 128 barcode:', err);
      }
    }
  }, [barcodeValue]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `StaffPulse_${barcodeValue}_ID_Card.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const cardContent = (
    <div className="id-card-element" id={`id-card-${barcodeValue}`}>
      {/* Top Lanyard Punch Hole Decoration */}
      <div className="id-card-punch-hole"></div>

      {/* Card Header Branding */}
      <div className="id-card-header">
        <div className="id-card-brand-row">
          <div className="id-card-logo-box">
            <Building2 size={20} color="#ffffff" />
          </div>
          <div className="id-card-brand-info">
            <span className="id-card-brand-name">StaffPulse EMS</span>
            <span className="id-card-brand-sub">Workforce OS Identity</span>
          </div>
        </div>
        <div className="id-card-chip-badge">
          <Sparkles size={11} />
          <span>AI VERIFIED</span>
        </div>
      </div>

      {/* Card Photo / Avatar Area */}
      <div className="id-card-avatar-section">
        <div className="id-card-avatar-ring">
          <div className="id-card-avatar">
            {employeeName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
        </div>
        <h3 className="id-card-employee-name">{employeeName}</h3>
        <p className="id-card-employee-role">{employeeRole}</p>
        <div className="id-card-dept-pill">
          <Briefcase size={12} />
          <span>{department}</span>
        </div>
      </div>

      {/* Card Meta Details */}
      <div className="id-card-meta-list">
        <div className="id-card-meta-item">
          <span className="meta-label">Employee ID:</span>
          <span className="meta-value">#{employeeId}</span>
        </div>
        <div className="id-card-meta-item">
          <span className="meta-label">Barcode UID:</span>
          <span className="meta-value highlight">{barcodeValue}</span>
        </div>
        <div className="id-card-meta-item">
          <span className="meta-label">Email:</span>
          <span className="meta-value text-truncate">{email}</span>
        </div>
        <div className="id-card-meta-item">
          <span className="meta-label">Status:</span>
          <span className="meta-value active-status">● Active Employee</span>
        </div>
      </div>

      {/* Code 128 High-Resolution Barcode Canvas */}
      <div className="id-card-barcode-box">
        <canvas ref={canvasRef} className="id-barcode-canvas" />
        <span className="barcode-standard-tag">STANDARD CODE 128 HIGH DENSITY</span>
      </div>

      {/* Card Footer Security Microprint */}
      <div className="id-card-footer">
        <ShieldCheck size={13} className="text-cyan" />
        <span>StaffPulse Workforce Intelligence Security • Scan for Attendance</span>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="id-card-modal-backdrop" onClick={onClose}>
        <div
          className="id-card-modal-content"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Employee Barcode ID Card"
        >
          <div className="id-card-modal-header no-print">
            <div className="modal-header-title">
              <QrCode size={20} className="text-cyan" />
              <span>Employee Barcode Identity Card</span>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="id-card-modal-body">
            {cardContent}

            {/* Action Buttons */}
            <div className="id-card-modal-actions no-print">
              <button
                type="button"
                className="btn btn-secondary btn-id-card-action"
                onClick={handleDownload}
                id="btn-download-barcode-img"
              >
                <Download size={16} />
                <span>Download Barcode PNG</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-id-card-action"
                onClick={handlePrint}
                id="btn-print-id-card"
              >
                <Printer size={16} />
                <span>Print ID Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="id-card-standalone-wrapper">
      {cardContent}
      <div className="id-card-action-bar no-print">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleDownload}
          id="btn-download-barcode"
        >
          <Download size={15} />
          <span>Save PNG</span>
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handlePrint}
          id="btn-print-barcode-card"
        >
          <Printer size={15} />
          <span>Print Card</span>
        </button>
      </div>
    </div>
  );
}
