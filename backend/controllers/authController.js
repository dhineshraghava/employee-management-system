import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

// Secret key required for registering new administrator accounts
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || 'EMS_ADMIN_2026';

// Temporary in-memory token store for password resets (expires in 15 minutes)
const resetTokenStore = new Map();

/**
 * POST /api/auth/login
 * Unified Login for both Administrators and Employees.
 * Server securely identifies user role, verifies credentials, and issues JWT.
 */
export async function unifiedLogin(req, res) {
  try {
    const identifier = (req.body.identifier || req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address or employee ID.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to authenticate.',
      });
    }

    // 1. Check Admins table by email
    const [adminRows] = await pool.query('SELECT * FROM admins WHERE LOWER(email) = ?', [identifier]);

    if (adminRows.length > 0) {
      const admin = adminRows[0];
      const passwordMatch = await bcrypt.compare(password, admin.password);

      if (passwordMatch) {
        const token = generateToken({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
        });

        return res.status(200).json({
          success: true,
          message: 'Administrator authentication successful.',
          token,
          role: 'admin',
          redirectUrl: '/admin/dashboard',
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
          },
        });
      }
    }

    // 2. Check Employees table by email OR numeric employee ID
    const isNumericId = /^\d+$/.test(identifier);
    let empRows = [];

    if (isNumericId) {
      const [rows] = await pool.query(
        'SELECT * FROM employees WHERE id = ? OR LOWER(email) = ?',
        [parseInt(identifier, 10), identifier]
      );
      empRows = rows;
    } else {
      const [rows] = await pool.query('SELECT * FROM employees WHERE LOWER(email) = ?', [identifier]);
      empRows = rows;
    }

    if (empRows.length > 0) {
      const emp = empRows[0];

      // Check account active status
      if (emp.is_active === 0) {
        return res.status(403).json({
          success: false,
          message: 'Your employee account is currently deactivated. Please contact your HR administrator.',
        });
      }

      if (!emp.password) {
        return res.status(401).json({
          success: false,
          message: 'No password has been configured for this account. Please ask HR Administrator to set your credentials.',
        });
      }

      const passwordMatch = await bcrypt.compare(password, emp.password);

      if (passwordMatch) {
        const token = generateToken({
          id: emp.id,
          email: emp.email,
          name: emp.name,
          role: 'employee',
          department: emp.department,
        });

        return res.status(200).json({
          success: true,
          message: 'Employee authentication successful.',
          token,
          role: 'employee',
          redirectUrl: '/employee/dashboard',
          user: {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            department: emp.department,
            designation: emp.designation,
            role: 'employee',
          },
        });
      }
    }

    // If identifier matched admin but password was wrong, or identifier matched emp but password was wrong
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please verify your email / Employee ID and password.',
    });
  } catch (error) {
    console.error('Unified login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal error occurred during authentication.',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/register
 * Unified Role-Based Registration with authorization safeguards.
 */
export async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      account_type = 'employee',
      phone,
      department,
      designation,
      employee_id,
      admin_secret,
    } = req.body;

    // Basic Validations
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : null;
    const cleanDept = department ? department.trim() : 'General';
    const cleanDesig = designation ? designation.trim() : 'Staff Member';

    // Check duplicate email across both admins and employees
    const [existingAdmin] = await pool.query('SELECT id FROM admins WHERE LOWER(email) = ?', [cleanEmail]);
    if (existingAdmin.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists in the system.',
      });
    }

    const [existingEmp] = await pool.query('SELECT id FROM employees WHERE LOWER(email) = ?', [cleanEmail]);
    if (existingEmp.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists in the system.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ==========================================
    // 1. ADMIN REGISTRATION (PROTECTED)
    // ==========================================
    if (account_type === 'admin') {
      if (!admin_secret || admin_secret.trim() !== ADMIN_SETUP_SECRET) {
        return res.status(403).json({
          success: false,
          message: 'Admin authorization failed: A valid administrative setup security key is required to register an Administrator account.',
        });
      }

      const [insertResult] = await pool.query(
        'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
        [cleanName, cleanEmail, hashedPassword, 'admin']
      );

      const newAdminId = insertResult.insertId;
      const token = generateToken({
        id: newAdminId,
        email: cleanEmail,
        name: cleanName,
        role: 'admin',
      });

      return res.status(201).json({
        success: true,
        message: 'Administrator account registered successfully.',
        token,
        role: 'admin',
        redirectUrl: '/admin/dashboard',
        user: {
          id: newAdminId,
          name: cleanName,
          email: cleanEmail,
          role: 'admin',
        },
      });
    }

    // ==========================================
    // 2. EMPLOYEE REGISTRATION
    // ==========================================
    // If specific employee_id was requested, check for collisions
    if (employee_id) {
      const [idCheck] = await pool.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
      if (idCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Employee ID #${employee_id} is already in use by another record.`,
        });
      }
    }

    const [insertResult] = await pool.query(
      `INSERT INTO employees (name, email, phone, department, designation, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'employee', 1)`,
      [cleanName, cleanEmail, cleanPhone, cleanDept, cleanDesig, hashedPassword]
    );

    const newEmpId = insertResult.insertId;
    const token = generateToken({
      id: newEmpId,
      email: cleanEmail,
      name: cleanName,
      role: 'employee',
      department: cleanDept,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee account created successfully.',
      token,
      role: 'employee',
      redirectUrl: '/employee/dashboard',
      user: {
        id: newEmpId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        department: cleanDept,
        designation: cleanDesig,
        role: 'employee',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete registration due to a server error.',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/forgot-password
 * Initiates a password-reset workflow
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if account exists
    const [admins] = await pool.query('SELECT id FROM admins WHERE LOWER(email) = ?', [cleanEmail]);
    const [employees] = await pool.query('SELECT id FROM employees WHERE LOWER(email) = ?', [cleanEmail]);

    if (admins.length === 0 && employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address was found in StaffPulse EMS.',
      });
    }

    // Generate 6-digit verification code & token
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    resetTokenStore.set(resetToken, {
      email: cleanEmail,
      code: resetCode,
      isAdmin: admins.length > 0,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    });

    return res.status(200).json({
      success: true,
      message: `Password reset verification token generated. For testing/demo convenience, your reset verification code is: ${resetCode}`,
      resetToken,
      resetCode,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request.',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/reset-password
 * Resets password using verification code and reset token
 */
export async function resetPassword(req, res) {
  try {
    const { resetToken, code, newPassword } = req.body;

    if (!resetToken || !resetTokenStore.has(resetToken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset session. Please request a new code.',
      });
    }

    const session = resetTokenStore.get(resetToken);
    if (Date.now() > session.expiresAt) {
      resetTokenStore.delete(resetToken);
      return res.status(400).json({
        success: false,
        message: 'Password reset session has expired. Please request a new one.',
      });
    }

    if (code && code.trim() !== session.code) {
      return res.status(400).json({
        success: false,
        message: 'The 6-digit verification code entered is incorrect.',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (session.isAdmin) {
      await pool.query('UPDATE admins SET password = ? WHERE LOWER(email) = ?', [
        hashedPassword,
        session.email,
      ]);
    } else {
      await pool.query('UPDATE employees SET password = ? WHERE LOWER(email) = ?', [
        hashedPassword,
        session.email,
      ]);
    }

    resetTokenStore.delete(resetToken);

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully updated! You can now sign in with your new credentials.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
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
      return res.status(200).json({ success: true, user: rows[0], role: 'admin' });
    } else {
      const [rows] = await pool.query(
        'SELECT id, name, email, phone, department, designation, salary, is_active, role FROM employees WHERE id = ?',
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee record not found.' });
      }
      return res.status(200).json({ success: true, user: rows[0], role: 'employee' });
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

/**
 * Legacy wrappers for backward compatibility
 */
export async function adminLogin(req, res) {
  return unifiedLogin(req, res);
}

export async function employeeLogin(req, res) {
  return unifiedLogin(req, res);
}
