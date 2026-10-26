import express from 'express';
import {
  getMyProfile,
  getMyAttendance,
  getMyTasks,
  updateMyTaskStatus,
  getMyDashboardStats,
} from '../controllers/employeePortalController.js';
import { authenticateToken, requireEmployee } from '../middleware/auth.js';

const router = express.Router();

// All employee portal endpoints require valid token with employee role
router.use(authenticateToken);
router.use(requireEmployee);

router.get('/profile', getMyProfile);
router.get('/attendance', getMyAttendance);
router.get('/tasks', getMyTasks);
router.get('/dashboard/stats', getMyDashboardStats);
router.patch('/tasks/:id/status', updateMyTaskStatus);

export default router;
