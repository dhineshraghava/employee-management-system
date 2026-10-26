-- ==============================================================
-- Employee Management System - Database Schema (emp_db)
-- Compatible with MySQL 8.0+ and MySQL Workbench
-- ==============================================================

CREATE DATABASE IF NOT EXISTS emp_db;
USE emp_db;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(15) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  salary DECIMAL(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Attendance Table
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

-- 3. Tasks Table
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

-- 4. Compatibility View: `employee` synonym for `employees`
CREATE OR REPLACE VIEW employee AS SELECT * FROM employees;

-- 5. Inspection Verification Queries
SHOW TABLES;
SELECT * FROM employees;
