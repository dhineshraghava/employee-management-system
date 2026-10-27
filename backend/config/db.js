import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'emp_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

export async function initializeDatabase() {
  try {
    const tempConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await tempConn.end();

    const connection = await pool.getConnection();
    console.log(`====================================================`);
    console.log(`✅ [MySQL Connected] Successfully connected to database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
    console.log(`====================================================`);

    // 1. Employees Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        phone VARCHAR(15) DEFAULT NULL,
        department VARCHAR(100) DEFAULT NULL,
        salary DECIMAL(10,2) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Safe schema extension: Check and add authentication columns to employees if not present
    const [empCols] = await connection.query('SHOW COLUMNS FROM employees');
    const existingEmpFields = empCols.map((c) => c.Field.toLowerCase());

    if (!existingEmpFields.includes('password')) {
      await connection.query('ALTER TABLE employees ADD COLUMN password VARCHAR(255) NULL AFTER email');
      console.log("ℹ️ [MySQL] Added 'password' column to 'employees'");
    }

    if (!existingEmpFields.includes('role')) {
      await connection.query("ALTER TABLE employees ADD COLUMN role VARCHAR(20) DEFAULT 'employee' AFTER password");
      console.log("ℹ️ [MySQL] Added 'role' column to 'employees'");
    }

    if (!existingEmpFields.includes('designation')) {
      await connection.query('ALTER TABLE employees ADD COLUMN designation VARCHAR(100) NULL AFTER department');
      console.log("ℹ️ [MySQL] Added 'designation' column to 'employees'");
    }

    if (!existingEmpFields.includes('is_active')) {
      await connection.query('ALTER TABLE employees ADD COLUMN is_active TINYINT(1) DEFAULT 1');
      console.log("ℹ️ [MySQL] Added 'is_active' column to 'employees'");
    }

    if (!existingEmpFields.includes('barcode')) {
      await connection.query('ALTER TABLE employees ADD COLUMN barcode VARCHAR(50) UNIQUE NULL AFTER designation');
      console.log("ℹ️ [MySQL] Added 'barcode' column to 'employees'");
    }

    // Automatically backfill Code 128 barcode format: EMP-<id> for all employees
    await connection.query("UPDATE employees SET barcode = CONCAT('EMP-', id) WHERE barcode IS NULL OR barcode = ''");

    // Set default password for any employees currently without password
    const defaultEmpPasswordHash = await bcrypt.hash('employee123', 10);
    await connection.query('UPDATE employees SET password = ? WHERE password IS NULL OR password = ""', [defaultEmpPasswordHash]);

    // 2. Admins Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Seed default Admin if no admin exists
    const [adminRows] = await connection.query('SELECT COUNT(*) as cnt FROM admins');
    if (adminRows[0].cnt === 0) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['System Administrator', 'admin@ems.com', adminPasswordHash, 'admin']
      );
      console.log("🔑 [MySQL] Seeded default admin account: admin@ems.com / admin123");
    }

    // 3. Attendance Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent', 'Late', 'Leave') NOT NULL DEFAULT 'Present',
        check_in TIME NULL,
        check_out TIME NULL,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_emp_date (employee_id, date),
        CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    const [attCols] = await connection.query('SHOW COLUMNS FROM attendance');
    const existingAttFields = attCols.map((c) => c.Field.toLowerCase());
    if (!existingAttFields.includes('barcode_scanned')) {
      await connection.query('ALTER TABLE attendance ADD COLUMN barcode_scanned TINYINT(1) DEFAULT 0');
      console.log("ℹ️ [MySQL] Added 'barcode_scanned' column to 'attendance'");
    }

    // 4. Tasks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
        priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
        due_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_tasks_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // 5. Leaves Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        leave_type ENUM('Casual Leave', 'Sick Leave', 'Paid Leave', 'Emergency Leave', 'Unpaid Leave') NOT NULL DEFAULT 'Casual Leave',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days INT NOT NULL DEFAULT 1,
        reason TEXT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
        admin_remarks VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_leaves_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // 6. Employee view for compatibility
    await connection.query(`
      CREATE OR REPLACE VIEW employee AS SELECT * FROM employees;
    `);

    const [empCount] = await connection.query('SELECT COUNT(*) as count FROM employees');
    console.log(`ℹ️ [MySQL] Table 'employees' contains ${empCount[0].count} record(s).`);

    connection.release();
    return true;
  } catch (error) {
    console.error(`====================================================`);
    console.error(`❌ [MySQL Connection Error]: ${error.message}`);
    console.error(`====================================================`);
    return false;
  }
}

export default pool;
