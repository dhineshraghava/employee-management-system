import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
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
  ShieldCheck,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { scanBarcodeAttendance, getAttendance } from '../services/api';

export default function BarcodeAttendance() {
  // Scanner state: 'Inactive' | 'Initializing' | 'Scanning' | 'Success' | 'Error'
  const [scannerState, setScannerState] = useState('Inactive');
  const [isScanning, setIsScanning] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [statusMessage, setStatusMessage] = useState('Camera scanner is inactive. Click "Start Camera" to scan.');
  const [errorMessage, setErrorMessage] = useState(null);
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
  const streamRef = useRef(null);
  const controlsRef = useRef(null);
  const readerRef = useRef(null);
  const scanLockRef = useRef(false);

  // Positive / Negative scan audio tone
  const playBeep = useCallback((success = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
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
      if (navigator?.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          const backCamera = videoInputs.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
          );
          setSelectedDeviceId(backCamera ? backCamera.deviceId : videoInputs[0].deviceId);
        }
      }
    } catch (err) {
      console.warn('Unable to enumerate camera devices:', err.message);
    }
  }, [selectedDeviceId]);

  // Fetch recent attendance from MySQL database
  const fetchRecentScans = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await getAttendance({ date: today });
      if (Array.isArray(res.data)) {
        setRecentScans(res.data.slice(0, 10));
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
      const trimmed = (scannedValue || '').toString().trim();
      if (!trimmed) return;
      if (scanLockRef.current || isProcessing) return;

      scanLockRef.current = true;
      setIsProcessing(true);
      setErrorMessage(null);
      setLastScannedCode(trimmed);
      setStatusMessage(`Verifying Code 128 barcode: "${trimmed}" with MySQL emp_db...`);

      try {
        const res = await scanBarcodeAttendance({
          barcode: trimmed,
          mode: attendanceMode,
        });

        if (res.data?.success) {
          playBeep(true);
          setScannerState('Success');
          setLatestResult({
            success: true,
            action: res.data.action,
            message: res.data.message,
            employee: res.data.employee,
            attendance: res.data.attendance,
            timestamp: new Date().toLocaleTimeString(),
          });
          setStatusMessage(
            `Success: ${res.data.employee.name} (${res.data.action === 'check_in' ? 'Check-In Recorded' : 'Check-Out Recorded'})`
          );
          fetchRecentScans();
        }
      } catch (err) {
        playBeep(false);
        setScannerState('Error');
        const errMsg =
          err.response?.data?.message || err.message || 'Failed to record attendance.';
        setErrorMessage(errMsg);
        setLatestResult({
          success: false,
          message: errMsg,
          scannedCode: trimmed,
          timestamp: new Date().toLocaleTimeString(),
        });
        setStatusMessage(`Verification Failed: ${errMsg}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [attendanceMode, fetchRecentScans, isProcessing, playBeep]
  );

  // Stop Camera Scanning & Release Stream
  const stopCamera = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {
        // ignore stop error
      }
      controlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    scanLockRef.current = false;
    setScannerState('Inactive');
    setStatusMessage('Webcam scanner stopped. Click "Start Camera" to resume.');
  }, []);

  // Start Camera Scanning with navigator.mediaDevices.getUserMedia()
  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setLatestResult(null);
    setScannerState('Initializing');
    setStatusMessage('Requesting camera access...');

    // 1. Verify Browser Support for getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errText =
        'Camera API (getUserMedia) is not supported in this browser or insecure context. Please ensure you are running on http://localhost or HTTPS.';
      setErrorMessage(errText);
      setScannerState('Error');
      setStatusMessage('Camera unsupported.');
      return;
    }

    try {
      // 2. Request Camera Stream with Appropriate Constraints
      const constraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 3. Attach Stream to Video Element & Wait for Metadata
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');

        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) {
            resolve();
          } else {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });

        await videoRef.current.play();
      }

      // 4. Initialize Multi-Format Code Reader with Code 128 Priority
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.UPC_A,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      readerRef.current = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 120,
      });

      // 5. Start Continuous Frame Decoding
      const controls = await readerRef.current.decodeFromVideoElement(
        videoRef.current,
        (result, decodeErr) => {
          if (result) {
            const rawText = result.getText();
            if (rawText && !scanLockRef.current) {
              handleBarcodeScanned(rawText);
            }
          }
          if (decodeErr && decodeErr.name !== 'NotFoundException') {
            // Normal scan loop iteration - no barcode in current frame
          }
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);
      setScannerState('Scanning');
      setStatusMessage('Camera active. Align employee Code 128 barcode within the reticle.');
    } catch (err) {
      console.error('Camera startup error:', err);
      stopCamera();
      setScannerState('Error');

      let userMsg = `Failed to access camera: ${err.message}.`;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMsg =
          'Camera permission was denied. Please allow camera permissions in your browser address bar to use live scanning.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMsg =
          'No camera device was detected on your system. Please connect a webcam or use the manual barcode entry field below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMsg =
          'The camera is currently in use by another application. Please close other camera tabs or software and try again.';
      }

      setErrorMessage(userMsg);
      setStatusMessage('Camera unavailable.');
    }
  };

  // Clean up camera stream and tracks on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Resume / Start Next Scan
  const handleStartNextScan = () => {
    scanLockRef.current = false;
    setLatestResult(null);
    setErrorMessage(null);
    if (isScanning) {
      setScannerState('Scanning');
      setStatusMessage('Ready for next scan. Align Code 128 barcode within target.');
    } else {
      setScannerState('Inactive');
      setStatusMessage('Ready. Click "Start Camera" or enter barcode manually.');
    }
  };

  // Manual Barcode Submit Handler
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    scanLockRef.current = false;
    handleBarcodeScanned(code);
    setManualCode('');
  };

  return (
    <div className="barcode-attendance-page hr-theme-page">
      {/* 1. Page Header */}
      <div className="page-header-row no-print">
        <div>
          <h1 className="page-main-title">Barcode Attendance System</h1>
          <p className="page-sub-title">
            Webcam and manual Code 128 barcode scanning for employee check-in and check-out verification.
          </p>
        </div>

        <div className="page-header-buttons">
          {/* Audio Beep Toggle */}
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${soundEnabled ? 'active-audio' : ''}`}
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Audio feedback enabled' : 'Audio feedback muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>

          {/* Mode Selector */}
          <div className="mode-toggle-group">
            <span className="mode-label">Mode:</span>
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

      {/* 2. Main Two-Column Layout */}
      <div className="dashboard-data-grid">
        {/* LEFT COLUMN: Camera Scanner Viewfinder & Controls */}
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 className="content-card-title">Live Barcode Scanner</h3>
              <p className="content-card-sub">Point employee barcode badge towards camera lens</p>
            </div>

            {/* Current Scanner State Badge */}
            <div className="flex-align-center gap-6">
              <span className={`scanner-state-pill state-${scannerState.toLowerCase()}`}>
                <span className="state-dot"></span>
                <span>{scannerState}</span>
              </span>
            </div>
          </div>

          {/* Camera Selection Dropdown if multiple cameras */}
          {videoDevices.length > 1 && (
            <div className="camera-select-row mb-3">
              <label htmlFor="select-camera-device" className="text-xs text-secondary font-semibold">
                Camera Device:
              </label>
              <select
                id="select-camera-device"
                className="input-compact"
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
            </div>
          )}

          {/* Video Preview Box */}
          <div className="scanner-viewport-box">
            <video
              ref={videoRef}
              className={`scanner-video-element ${isScanning ? 'active' : 'hidden'}`}
              autoPlay
              playsInline
              muted
            />

            {!isScanning && (
              <div className="scanner-placeholder">
                <div className="placeholder-icon-ring">
                  <ScanLine size={44} className="text-primary" />
                </div>
                <h3 className="placeholder-title">Webcam Scanner Inactive</h3>
                <p className="placeholder-sub">
                  Click "Start Camera" to initialize the webcam and begin scanning employee Code 128 barcodes.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={startCamera}
                  disabled={scannerState === 'Initializing'}
                  id="btn-start-camera"
                >
                  <Camera size={16} />
                  <span>{scannerState === 'Initializing' ? 'Initializing...' : 'Start Camera'}</span>
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
                <span>Verifying with MySQL Database...</span>
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="scanner-controls-bar mt-3">
            {isScanning ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={stopCamera}
                id="btn-stop-camera"
              >
                <CameraOff size={15} />
                <span>Stop Camera</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={startCamera}
                disabled={scannerState === 'Initializing'}
                id="btn-start-camera-secondary"
              >
                <Camera size={15} />
                <span>Start Camera</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleStartNextScan}
              id="btn-next-scan"
            >
              <RefreshCw size={14} />
              <span>Start Next Scan</span>
            </button>
          </div>

          {/* Scanner Status Message Strip */}
          <div className="scanner-status-strip mt-3">
            <span className="status-label">Status:</span>
            <span className="status-message">{statusMessage}</span>
          </div>

          {/* Error Banner if error occurred */}
          {errorMessage && (
            <div className="scanner-error-banner mt-3" role="alert">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span className="text-xs text-danger font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Manual Barcode Entry Fallback Card */}
          <div className="manual-barcode-panel mt-4">
            <h4 className="manual-title">Manual Barcode Entry (Fallback)</h4>
            <p className="manual-sub">
              Enter employee barcode value (e.g. <code>EMP-1</code> or <code>1</code>) to record attendance manually.
            </p>
            <form onSubmit={handleManualSubmit} className="manual-input-form mt-2">
              <input
                type="text"
                className="filter-text-input manual-input-field"
                placeholder="Enter Barcode ID (e.g. EMP-1, EMP-2)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={isProcessing}
                id="input-manual-barcode"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!manualCode.trim() || isProcessing}
                id="btn-submit-manual-barcode"
              >
                <span>Verify / Scan</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Verification Result & Today's Scanned Activity Feed */}
        <div className="flex-column gap-18">
          {/* 1. Live Verification Result Card */}
          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3 className="content-card-title">Live Verification Result</h3>
                <p className="content-card-sub">Immediate attendance verification outcome from MySQL</p>
              </div>
              {latestResult && (
                <span className="result-timestamp text-xs text-muted font-mono">
                  {latestResult.timestamp}
                </span>
              )}
            </div>

            {latestResult ? (
              latestResult.success ? (
                <div className="result-body result-success">
                  <div className="result-badge-row">
                    <span className={`status-pill badge-${latestResult.action === 'check_in' ? 'present' : 'completed'}`}>
                      <CheckCircle2 size={14} />
                      {latestResult.action === 'check_in' ? 'CHECK-IN CONFIRMED' : 'CHECK-OUT CONFIRMED'}
                    </span>
                    <span className="code-id">{latestResult.employee.barcode}</span>
                  </div>

                  <div className="result-employee-profile mt-3">
                    <div className="card-avatar-circle">
                      {(latestResult.employee.name || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div className="result-details">
                      <h4 className="result-emp-name">{latestResult.employee.name}</h4>
                      <p className="result-emp-role">
                        {latestResult.employee.designation || 'Staff Member'} •{' '}
                        {latestResult.employee.department || 'Operations'}
                      </p>
                      <span className="text-xs text-muted font-mono">
                        Employee ID: #{latestResult.employee.id}
                      </span>
                    </div>
                  </div>

                  <div className="result-metrics-grid mt-3">
                    <div className="metric-box">
                      <span className="metric-label">Date</span>
                      <strong className="metric-val">{latestResult.attendance.date}</strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Check-In</span>
                      <strong className="metric-val text-primary">
                        {latestResult.attendance.check_in || '—'}
                      </strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Check-Out</span>
                      <strong className="metric-val text-navy">
                        {latestResult.attendance.check_out || '—'}
                      </strong>
                    </div>
                    {latestResult.attendance.working_duration && (
                      <div className="metric-box full-width">
                        <span className="metric-label">Recorded Work Duration</span>
                        <strong className="metric-val text-success">
                          {latestResult.attendance.working_duration} ({latestResult.attendance.working_hours || 0} hrs)
                        </strong>
                      </div>
                    )}
                  </div>

                  <p className="result-confirmation-note mt-3">
                    <ShieldCheck size={14} className="text-success" />
                    <span>Transaction committed to MySQL <code>emp_db.attendance</code></span>
                  </p>
                </div>
              ) : (
                <div className="result-body result-failure">
                  <div className="result-error-icon">
                    <AlertCircle size={28} className="text-danger" />
                  </div>
                  <h4 className="error-title">Verification Conflict / Error</h4>
                  <p className="error-description">{latestResult.message}</p>
                  {latestResult.scannedCode && (
                    <div className="scanned-raw-code mt-2">
                      <span>Scanned Barcode: </span>
                      <code className="code-id">{latestResult.scannedCode}</code>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-3"
                    onClick={handleStartNextScan}
                  >
                    Start Next Scan
                  </button>
                </div>
              )
            ) : (
              <div className="result-body result-empty">
                <Clock size={36} className="text-muted mb-2" />
                <h4 className="text-sm font-bold text-navy">Awaiting Barcode Scan</h4>
                <p className="text-xs text-muted">
                  Position an employee Code 128 barcode in front of the lens or submit via manual input.
                </p>
              </div>
            )}
          </div>

          {/* 2. Today's Recorded Scans Feed */}
          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3 className="content-card-title">Today's Recorded Scans</h3>
                <p className="content-card-sub">Recent punches saved in MySQL emp_db for current date</p>
              </div>
              <button
                type="button"
                className="btn-text-action"
                onClick={fetchRecentScans}
                title="Refresh scan history"
                aria-label="Refresh scan history"
              >
                <RefreshCw size={14} className={loadingRecent ? 'spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="hr-compact-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRecent ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        Loading today's punches...
                      </td>
                    </tr>
                  ) : recentScans.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No barcode scans recorded yet for today.
                      </td>
                    </tr>
                  ) : (
                    recentScans.map((scan) => (
                      <tr key={scan.id}>
                        <td>
                          <strong className="text-navy">{scan.employee_name}</strong>
                        </td>
                        <td>{scan.employee_department || 'General'}</td>
                        <td>{scan.check_in || '—'}</td>
                        <td>{scan.check_out || '—'}</td>
                        <td>
                          <span className={`status-pill badge-${(scan.status || 'present').toLowerCase()}`}>
                            {scan.status}
                          </span>
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
    </div>
  );
}
