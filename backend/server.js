import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import pool, { dbConfig, initializeDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import employeePortalRoutes from './routes/employeePortalRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { getDashboardStats } from './controllers/employeeController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());

// Health Check API
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1 as ping');
    connection.release();

    return res.status(200).json({
      success: true,
      status: 'online',
      server: 'Employee Management Backend with Two-Panel System (Admin & Employee)',
      database: {
        connected: true,
        name: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'database_disconnected',
      server: 'online',
      database: {
        connected: false,
        name: dbConfig.database,
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeePortalRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/ai', aiRoutes);
app.get('/api/dashboard/stats', getDashboardStats);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Full-Stack Employee Management Backend Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
    console.log(`💼 Employee Portal API: http://localhost:${PORT}/api/employee`);
    console.log(`📅 Attendance API: http://localhost:${PORT}/api/attendance`);
    console.log(`📋 Tasks API: http://localhost:${PORT}/api/tasks`);
    console.log(`====================================================`);
  });
}

startServer();

export default app;
