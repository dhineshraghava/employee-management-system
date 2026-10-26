import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_ems_2026_secure';

/**
 * Middleware: Verify JWT Bearer token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}

/**
 * Middleware: Require Administrator Role
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrative privileges are required.',
    });
  }
  next();
}

/**
 * Middleware: Require Employee Role
 */
export function requireEmployee(req, res, next) {
  if (!req.user || req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employee privileges are required.',
    });
  }
  next();
}

/**
 * Helper to generate JWT Token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
