import express from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getTodaySummary,
} from '../controllers/attendanceController.js';
import { employeeCheckIn, employeeCheckOut } from '../controllers/employeePortalController.js';
import { authenticateToken, requireEmployee, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public/Admin or Authenticated
router.get('/summary/today', getTodaySummary);

// Employee check-in and check-out routes
router.post('/check-in', authenticateToken, requireEmployee, employeeCheckIn);
router.post('/check-out', authenticateToken, requireEmployee, employeeCheckOut);

// General attendance endpoints
router.get('/', getAllAttendance);
router.get('/:id', getAttendanceById);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

export default router;
