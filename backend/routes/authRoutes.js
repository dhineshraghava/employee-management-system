import express from 'express';
import { adminLogin, employeeLogin, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/admin/login', adminLogin);
router.post('/employee/login', employeeLogin);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
