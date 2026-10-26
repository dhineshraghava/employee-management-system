import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

/**
 * POST /api/auth/admin/login
 * Authenticate Administrator
 */
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Admin email is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator email address or password.',
      });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator email address or password.',
      });
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin',
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during admin authentication.',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/employee/login
 * Authenticate Employee
 */
export async function employeeLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Employee email is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM employees WHERE email = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee email address or password.',
      });
    }

    const emp = rows[0];

    if (emp.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: 'Your employee account is currently deactivated. Please contact your HR administrator.',
      });
    }

    if (!emp.password) {
      return res.status(401).json({
        success: false,
        message: 'No login password configured for this account. Please ask HR Administrator to set your initial password.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, emp.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee email address or password.',
      });
    }

    const token = generateToken({
      id: emp.id,
      email: emp.email,
      name: emp.name,
      role: 'employee',
      department: emp.department,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee login successful.',
      token,
      user: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        role: 'employee',
      },
    });
  } catch (error) {
    console.error('Employee login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during employee authentication.',
      error: error.message,
    });
  }
}

/**
 * GET /api/auth/me
 * Return currently authenticated user info from token
 */
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (req.user.role === 'admin') {
      const [rows] = await pool.query('SELECT id, name, email, role FROM admins WHERE id = ?', [req.user.id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin record not found.' });
      }
      return res.status(200).json({ success: true, user: rows[0] });
    } else {
      const [rows] = await pool.query(
        'SELECT id, name, email, phone, department, designation, salary, is_active, role FROM employees WHERE id = ?',
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee record not found.' });
      }
      return res.status(200).json({ success: true, user: rows[0] });
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/logout
 */
export function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}
