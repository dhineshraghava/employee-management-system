import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword,
  getDashboardStats,
  getAdminReports,
} from '../controllers/employeeController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Enforce authentication on all routes
router.use(authenticateToken);

// Admin Employee Management (Strictly Admin only)
router.get('/employees', requireAdmin, getAllEmployees);
router.post('/employees', requireAdmin, createEmployee);
router.get('/employees/:id', requireAdmin, getEmployeeById);
router.put('/employees/:id', requireAdmin, updateEmployee);
router.delete('/employees/:id', requireAdmin, deleteEmployee);
router.post('/employees/:id/reset-password', requireAdmin, resetEmployeePassword);

// Dashboard Statistics (Accessible to all authenticated sessions; Admin & Employee)
router.get('/dashboard/stats', getDashboardStats);

// Analytical Reports (Strictly Admin only)
router.get('/reports', requireAdmin, getAdminReports);

export default router;
