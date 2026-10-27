import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  cancelMyLeave,
  getAllLeaves,
  updateLeaveStatus,
  deleteLeave,
  getLeaveSummary,
} from '../controllers/leaveController.js';
import { authenticateToken, requireAdmin, requireEmployee } from '../middleware/auth.js';

const router = express.Router();

// Require authentication for all leave routes
router.use(authenticateToken);

// --- Employee Specific Endpoints ---
router.post('/apply', requireEmployee, applyLeave);
router.get('/my', requireEmployee, getMyLeaves);
router.patch('/my/:id/cancel', requireEmployee, cancelMyLeave);

// --- Admin Specific Endpoints ---
router.get('/', requireAdmin, getAllLeaves);
router.patch('/:id/status', requireAdmin, updateLeaveStatus);
router.delete('/:id', requireAdmin, deleteLeave);
router.get('/summary', getLeaveSummary);

export default router;
