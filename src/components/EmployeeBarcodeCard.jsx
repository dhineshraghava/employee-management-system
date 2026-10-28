import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Building2,
  Printer,
  Download,
  Eye,
  ShieldCheck,
  X,
} from 'lucide-react';

export default function EmployeeBarcodeCard({ employee, onClose, isModal = false, onViewModal }) {
  const canvasRef = useRef(null);
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const rawId = employee?.id || '1';
  const barcodeValue = employee?.barcode || `EMP-${rawId}`;
  const employeeName = employee?.name || 'Staff Member';
  const department = employee?.department || 'Operations';
  const email = employee?.email || 'staff@ems.com';
  const displayId = String(barcodeValue).startsWith('EMP-') ? barcodeValue : `EMP-${rawId}`;

  const renderBarcode = () => {
    if (canvasRef.current && barcodeValue) {
      try {
        JsBarcode(canvasRef.current, barcodeValue, {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: 2.0,
          height: 48,
          displayValue: true,
          font: 'monospace',
          fontSize: 13,
          fontOptions: 'bold',
          textMargin: 4,
          background: '#ffffff',
          margin: 6,
        });
      } catch (err) {
        console.error('Failed to generate Code 128 barcode:', err);
      }
    }
  };

  useEffect(() => {
    renderBarcode();
  }, [barcodeValue]);

  const handleDownload = (e) => {
    e?.stopPropagation();
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `Decconz_${barcodeValue}_Badge.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrint = (e) => {
    e?.stopPropagation();
    window.print();
  };

  const handleOpenView = (e) => {
    e?.stopPropagation();
    if (onViewModal) {
      onViewModal(employee);
    } else {
      setInternalModalOpen(true);
    }
  };

  const initial = (employeeName || 'E').charAt(0).toUpperCase();

  const cardContent = (
    <div className="clean-barcode-card" id={`barcode-card-${barcodeValue}`}>
      {/* 1. Dark Navy Top Strip with Company Name and Employee ID */}
      <div className="card-navy-top-strip">
        <div className="strip-brand">
          <Building2 size={15} className="strip-logo-icon" />
          <span className="strip-company-name">Decconz EMS</span>
        </div>
        <span className="strip-employee-id">{displayId}</span>
      </div>

      {/* 2. White Card Content Area */}
      <div className="card-white-body">
        {/* Simple Avatar with Initial */}
        <div className="card-avatar-wrapper">
          <div className="card-avatar-circle">{initial}</div>
        </div>

        {/* Employee Details */}
        <h4 className="card-emp-name">{employeeName}</h4>
        <p className="card-emp-dept">{department}</p>
        <p className="card-emp-email">{email}</p>

        {/* Barcode Section */}
        <div className="card-barcode-box">
          <canvas ref={canvasRef} className="card-barcode-canvas" />
          <span className="scan-attendance-label">Scan for Attendance</span>
        </div>
      </div>

      {/* 3. Card Action Buttons: View Card, Download, Print */}
      {!isModal && (
        <div className="card-actions-strip no-print">
          <button
            type="button"
            className="btn-card-action"
            onClick={handleOpenView}
            title="Preview Card"
          >
            <Eye size={13} />
            <span>View Card</span>
          </button>

          <button
            type="button"
            className="btn-card-action"
            onClick={handleDownload}
            title="Download PNG"
          >
            <Download size={13} />
            <span>Download</span>
          </button>

          <button
            type="button"
            className="btn-card-action"
            onClick={handlePrint}
            title="Print Card"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      )}
    </div>
  );

  // If rendered as a full modal
  if (isModal) {
    return (
      <div className="card-modal-backdrop" onClick={onClose}>
        <div className="card-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="card-modal-header no-print">
            <h3 className="modal-title">Employee Barcode Identity Card</h3>
            <button type="button" className="modal-close-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="card-modal-body">
            {cardContent}
          </div>

          <div className="card-modal-footer no-print">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownload}
            >
              <Download size={15} />
              <span>Download Image</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>Print Badge</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="barcode-card-outer">
        {cardContent}
      </div>

      {internalModalOpen && (
        <EmployeeBarcodeCard
          employee={employee}
          isModal={true}
          onClose={() => setInternalModalOpen(false)}
        />
      )}
    </>
  );
}
