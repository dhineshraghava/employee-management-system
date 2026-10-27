import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  Camera,
  CameraOff,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { scanBarcodeAttendance, getAttendance } from '../services/api';

export default function BarcodeAttendance() {
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [scannerStatus, setScannerStatus] = useState('Idle. Click "Start Camera" to scan.');
  const [scannerError, setScannerError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scan result state
  const [latestResult, setLatestResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');

  // Scanning mode: 'auto' | 'check_in' | 'check_out'
  const [attendanceMode, setAttendanceMode] = useState('auto');

  // Recent scans feed from database
  const [recentScans, setRecentScans] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const readerRef = useRef(null);
  const scanLockRef = useRef(false);

  // Synthesize positive scan beep using Web Audio API
  const playBeep = useCallback((success = true) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // AudioContext unavailable
    }
  }, [soundEnabled]);

  // Load available video cameras
  const fetchCameras = useCallback(async () => {
    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setVideoDevices(devices);
      if (devices.length > 0 && !selectedDeviceId) {
        // Prefer back camera on mobile devices if available
        const backCamera = devices.find((d) =>
          d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
        );
        setSelectedDeviceId(backCamera ? backCamera.deviceId : devices[0].deviceId);
      }
    } catch (err) {
      console.warn('Unable to list camera devices:', err.message);
    }
  }, [selectedDeviceId]);

  // Fetch recent attendance from MySQL database
  const fetchRecentScans = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await getAttendance({ date: today });
      if (Array.isArray(res.data)) {
        setRecentScans(res.data.slice(0, 8));
      }
    } catch (err) {
      console.error('Error fetching recent attendance scans:', err);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
    fetchRecentScans();
  }, [fetchCameras, fetchRecentScans]);

  // Handle scanned barcode submission to MySQL backend
  const handleBarcodeScanned = useCallback(
    async (scannedValue) => {
      if (scanLockRef.current || isProcessing) return;
      scanLockRef.current = true;
      setIsProcessing(true);
      setScannerError(null);
      setLastScannedCode(scannedValue);

      try {
        setScannerStatus(`Verifying Code 128 barcode: "${scannedValue}"...`);
        const res = await scanBarcodeAttendance({
          barcode: scannedValue,
          mode: attendanceMode,
        });

        if (res.data?.success) {
          playBeep(true);
          setLatestResult({
            success: true,
            action: res.data.action,
            message: res.data.message,
            employee: res.data.employee,
            attendance: res.data.attendance,
            timestamp: new Date().toLocaleTimeString(),
          });
          setScannerStatus(
            `Success: ${res.data.employee.name} (${res.data.action === 'check_in' ? 'Checked In' : 'Checked Out'})`
          );
          fetchRecentScans();
        }
      } catch (err) {
        playBeep(false);
        const errMsg =
          err.response?.data?.message || err.message || 'Failed to record barcode attendance.';
        setScannerError(errMsg);
        setLatestResult({
          success: false,
          message: errMsg,
          scannedCode: scannedValue,
          timestamp: new Date().toLocaleTimeString(),
        });
        setScannerStatus(`Error: ${errMsg}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [attendanceMode, fetchRecentScans, isProcessing, playBeep]
  );

  // Start Camera Scanning
  const startCamera = async () => {
    setScannerError(null);
    setLatestResult(null);

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      setScannerStatus('Initializing video camera feed...');

      const controls = await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId || undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const rawText = result.getText();
            if (rawText && !scanLockRef.current) {
              handleBarcodeScanned(rawText);
            }
          }
          if (error && error.name !== 'NotFoundException') {
            // normal scanning loop, ignore standard frame-not-found
          }
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);
      setScannerStatus('Camera active. Hold an employee barcode in front of the lens.');
    } catch (err) {
      console.error('Camera startup error:', err);
      setIsScanning(false);
      setScannerError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : `Failed to access camera: ${err.message}. You can still enter barcodes manually below.`
      );
      setScannerStatus('Camera unavailable.');
    }
  };

  // Stop Camera Scanning
  const stopCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    scanLockRef.current = false;
    setScannerStatus('Camera paused. Click "Start Camera" to resume.');
  };

  // Clean up camera tracks on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  // Resume / Start Next Scan
  const handleStartNextScan = () => {
    scanLockRef.current = false;
    setLatestResult(null);
    setScannerError(null);
    setScannerStatus(
      isScanning
        ? 'Ready for next scan. Point barcode at the camera.'
        : 'Ready. Start camera or enter code manually.'
    );
  };

  // Manual Barcode Submit Handler
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    scanLockRef.current = false;
    handleBarcodeScanned(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="barcode-attendance-page">
      {/* Top Header */}
      <div className="page-header barcode-header">
        <div className="header-title-group">
          <div className="header-icon-badge">
            <Camera size={26} className="text-cyan" />
          </div>
          <div>
            <h1 className="page-title">Barcode Attendance System</h1>
            <p className="page-subtitle">
              High-precision Code 128 barcode scanning for instant employee check-in and check-out verification.
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* Audio Beep Toggle */}
          <button
            type="button"
            className={`btn btn-secondary btn-icon-only ${soundEnabled ? 'active-tone' : ''}`}
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Audio Feedback Enabled' : 'Audio Feedback Muted'}
            aria-label="Toggle scan tone"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Mode Selector */}
          <div className="attendance-mode-selector">
            <span className="mode-selector-label">Mode:</span>
            <div className="mode-pills">
              <button
                type="button"
                className={`mode-pill ${attendanceMode === 'auto' ? 'active' : ''}`}
                onClick={() => setAttendanceMode('auto')}
              >
                Auto (Smart)
              </button>
              <button
                type="button"
                className={`mode-pill ${attendanceMode === 'check_in' ? 'active' : ''}`}
                onClick={() => setAttendanceMode('check_in')}
              >
                Check-In
              </button>
              <button
                type="button"
                className={`mode-pill ${attendanceMode === 'check_out' ? 'active' : ''}`}
                onClick={() => setAttendanceMode('check_out')}
              >
                Check-Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="barcode-scanner-grid">
        {/* LEFT COLUMN: Camera Scanner Viewfinder */}
        <div className="scanner-viewfinder-card">
          <div className="viewfinder-header">
            <div className="viewfinder-status-tag">
              <span className={`status-dot ${isScanning ? 'pulse-green' : 'dot-gray'}`}></span>
              <span>{isScanning ? 'LIVE SCANNER READY' : 'SCANNER STANDBY'}</span>
            </div>

            {/* Camera Switcher Dropdown */}
            {videoDevices.length > 1 && (
              <select
                className="camera-device-select"
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  if (isScanning) {
                    stopCamera();
                    setTimeout(startCamera, 300);
                  }
                }}
                disabled={isProcessing}
              >
                {videoDevices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Video Preview Box */}
          <div className="scanner-viewport-box">
            <video
              ref={videoRef}
              className={`scanner-video-element ${isScanning ? 'active' : 'hidden'}`}
              playsInline
              muted
            />

            {!isScanning && (
              <div className="scanner-placeholder">
                <div className="placeholder-icon-ring">
                  <ScanLine size={48} className="text-cyan-glow" />
                </div>
                <h3 className="placeholder-title">Webcam Scanner Inactive</h3>
                <p className="placeholder-sub">
                  Click the button below to enable your camera and scan Code 128 employee badges.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-start-camera"
                  onClick={startCamera}
                  id="btn-start-camera"
                >
                  <Camera size={18} />
                  <span>Start Camera Scanner</span>
                </button>
              </div>
            )}

            {/* Live Targeting Reticle & Laser */}
            {isScanning && (
              <div className="scanner-reticle-overlay">
                <div className="scanner-laser-line"></div>
                <div className="reticle-corner top-left"></div>
                <div className="reticle-corner top-right"></div>
                <div className="reticle-corner bottom-left"></div>
                <div className="reticle-corner bottom-right"></div>
                <div className="reticle-guide-text">Align Code 128 Barcode Inside Target</div>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="scanner-processing-overlay">
                <div className="processing-spinner"></div>
                <span>Validating with Database...</span>
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="scanner-controls-bar">
            {isScanning ? (
              <button
                type="button"
                className="btn btn-danger btn-toggle-camera"
                onClick={stopCamera}
                id="btn-stop-camera"
              >
                <CameraOff size={18} />
                <span>Stop Camera</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-toggle-camera"
                onClick={startCamera}
                id="btn-start-camera-secondary"
              >
                <Camera size={18} />
                <span>Start Camera</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-next-scan"
              onClick={handleStartNextScan}
              id="btn-next-scan"
            >
              <RefreshCw size={16} />
              <span>Start Next Scan</span>
            </button>
          </div>

          {/* Status Message Strip */}
          <div className="scanner-status-strip">
            <span className="status-label">Scanner Status:</span>
            <span className="status-message">{scannerStatus}</span>
          </div>

          {/* Manual Barcode Entry Fallback */}
          <div className="manual-barcode-panel">
            <div className="manual-header">
              <span className="manual-title">Manual Barcode UID Entry (Fallback)</span>
            </div>
            <form onSubmit={handleManualSubmit} className="manual-input-form">
              <input
                type="text"
                className="form-input manual-barcode-input"
                placeholder="e.g. EMP-1 or 1"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={isProcessing}
                id="input-manual-barcode"
              />
              <button
                type="submit"
                className="btn btn-secondary btn-submit-manual"
                disabled={!manualCode.trim() || isProcessing}
                id="btn-submit-manual-barcode"
              >
                <span>Record Attendance</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Scan Results & Live Feed */}
        <div className="scanner-results-column">
          {/* Latest Result Card */}
          <div className="scan-result-card">
            <div className="result-card-header">
              <span className="result-card-title">Live Verification Result</span>
              {latestResult && (
                <span className="result-timestamp">{latestResult.timestamp}</span>
              )}
            </div>

            {latestResult ? (
              latestResult.success ? (
                <div className="result-body result-success">
                  <div className="result-badge-row">
                    <span className={`result-action-badge ${latestResult.action}`}>
                      <CheckCircle2 size={16} />
                      {latestResult.action === 'check_in' ? 'CHECK-IN CONFIRMED' : 'CHECK-OUT CONFIRMED'}
                    </span>
                    <span className="badge-pill code-pill">{latestResult.employee.barcode}</span>
                  </div>

                  <div className="result-employee-profile">
                    <div className="result-avatar">
                      {latestResult.employee.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="result-details">
                      <h3 className="result-emp-name">{latestResult.employee.name}</h3>
                      <p className="result-emp-role">
                        {latestResult.employee.designation || 'Staff Member'} •{' '}
                        {latestResult.employee.department || 'Operations'}
                      </p>
                      <span className="result-emp-id">Employee ID: #{latestResult.employee.id}</span>
                    </div>
                  </div>

                  <div className="result-metrics-grid">
                    <div className="metric-box">
                      <span className="metric-label">Date</span>
                      <span className="metric-val">{latestResult.attendance.date}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Check-In</span>
                      <span className="metric-val text-cyan">
                        {latestResult.attendance.check_in || '---'}
                      </span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Check-Out</span>
                      <span className="metric-val text-blue">
                        {latestResult.attendance.check_out || '---'}
                      </span>
                    </div>
                    {latestResult.attendance.working_duration && (
                      <div className="metric-box full-width">
                        <span className="metric-label">Logged Duration</span>
                        <span className="metric-val text-green">
                          {latestResult.attendance.working_duration} ({latestResult.attendance.working_hours || 0} hrs)
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="result-confirmation-note">
                    <ShieldCheck size={14} className="text-cyan" />
                    <span>Database transaction committed to MySQL `emp_db` • Table: `attendance`</span>
                  </p>
                </div>
              ) : (
                <div className="result-body result-failure">
                  <div className="result-error-icon">
                    <AlertCircle size={32} />
                  </div>
                  <h4 className="error-title">Verification Failed</h4>
                  <p className="error-description">{latestResult.message}</p>
                  {latestResult.scannedCode && (
                    <div className="scanned-raw-code">
                      <span>Scanned Value:</span>
                      <code>{latestResult.scannedCode}</code>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleStartNextScan}
                  >
                    Try Again
                  </button>
                </div>
              )
            ) : (
              <div className="result-body result-empty">
                <Clock size={36} className="empty-clock-icon" />
                <h4>Awaiting Barcode Scan</h4>
                <p>
                  Position an employee Code 128 barcode badge in front of the camera or enter the code manually.
                </p>
              </div>
            )}
          </div>

          {/* Today's Scanned Attendance Activity Feed */}
          <div className="today-scans-feed-card">
            <div className="feed-header">
              <div className="feed-title-wrap">
                <Clock size={16} className="text-cyan" />
                <span className="feed-title">Today's Recorded Scans</span>
              </div>
              <button
                type="button"
                className="btn-refresh-feed"
                onClick={fetchRecentScans}
                title="Refresh scan history"
                aria-label="Refresh scan history"
              >
                <RefreshCw size={14} className={loadingRecent ? 'spin' : ''} />
              </button>
            </div>

            <div className="feed-list">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <div key={scan.id} className="feed-item">
                    <div className="feed-item-avatar">
                      {scan.employee_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'EM'}
                    </div>
                    <div className="feed-item-info">
                      <div className="feed-item-name-row">
                        <span className="feed-emp-name">{scan.employee_name}</span>
                        <span className={`status-badge status-${scan.status.toLowerCase()}`}>
                          {scan.status}
                        </span>
                      </div>
                      <div className="feed-item-sub">
                        <span>{scan.employee_department}</span>
                        <span>•</span>
                        <span>In: {scan.check_in || '--:--'}</span>
                        {scan.check_out && (
                          <>
                            <span>•</span>
                            <span>Out: {scan.check_out}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="feed-empty-state">
                  <span>No attendance scans recorded for today yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
