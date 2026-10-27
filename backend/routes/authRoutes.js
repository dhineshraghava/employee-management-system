import express from 'express';
import {
  unifiedLogin,
  register,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  logout,
  adminLogin,
  employeeLogin,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Unified Authentication Endpoints
router.post('/login', unifiedLogin);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);

// Legacy backward-compatibility endpoints
router.post('/admin/login', adminLogin);
router.post('/employee/login', employeeLogin);

export default router;
