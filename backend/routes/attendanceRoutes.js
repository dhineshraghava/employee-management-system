import express from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getTodaySummary,
  recordBarcodeAttendance,
  getEmployeeBarcodeCard,
} from '../controllers/attendanceController.js';
import { employeeCheckIn, employeeCheckOut } from '../controllers/employeePortalController.js';
import { authenticateToken, requireEmployee } from '../middleware/auth.js';

const router = express.Router();

// Barcode Scanning Attendance & Card Endpoints
router.post('/scan', recordBarcodeAttendance);
router.get('/barcode/card/:id', getEmployeeBarcodeCard);

// Summary & Status
router.get('/summary/today', getTodaySummary);

// Employee Portal Check-In/Check-Out
router.post('/check-in', authenticateToken, requireEmployee, employeeCheckIn);
router.post('/check-out', authenticateToken, requireEmployee, employeeCheckOut);

// Standard CRUD Attendance endpoints
router.get('/', getAllAttendance);
router.get('/:id', getAttendanceById);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

export default router;
