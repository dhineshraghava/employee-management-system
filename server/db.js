import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'employees.sqlite');

const DEMO_EMPLOYEES = [
  {
    id: 'EMP-DEMO-001',
    fullName: 'Alice Johnson',
    email: 'alice.johnson@demo.com',
    phone: '9876543210',
    gender: 'Female',
    dob: '1990-05-15',
    department: 'Engineering',
    designation: 'Senior Developer',
    joiningDate: '2020-01-10',
    employmentType: 'Full-time',
    salary: '85000',
    address: '123 Tech Park, Bangalore, Karnataka 560001',
    isDemo: 1,
    createdAt: new Date('2020-01-10').toISOString(),
  },
  {
    id: 'EMP-DEMO-002',
    fullName: 'Bob Martinez',
    email: 'bob.martinez@demo.com',
    phone: '8765432109',
    gender: 'Male',
    dob: '1988-11-22',
    department: 'Marketing',
    designation: 'Marketing Manager',
    joiningDate: '2019-03-15',
    employmentType: 'Full-time',
    salary: '72000',
    address: '456 Business Ave, Mumbai, Maharashtra 400001',
    isDemo: 1,
    createdAt: new Date('2019-03-15').toISOString(),
  },
  {
    id: 'EMP-DEMO-003',
    fullName: 'Carol Smith',
    email: 'carol.smith@demo.com',
    phone: '7654321098',
    gender: 'Female',
    dob: '1995-07-30',
    department: 'Human Resources',
    designation: 'HR Executive',
    joiningDate: '2022-06-01',
    employmentType: 'Full-time',
    salary: '55000',
    address: '789 Corporate Road, Delhi, Delhi 110001',
    isDemo: 1,
    createdAt: new Date('2022-06-01').toISOString(),
  },
  {
    id: 'EMP-DEMO-004',
    fullName: 'David Lee',
    email: 'david.lee@demo.com',
    phone: '6543210987',
    gender: 'Male',
    dob: '1992-02-14',
    department: 'Finance',
    designation: 'Financial Analyst',
    joiningDate: '2021-09-01',
    employmentType: 'Contract',
    salary: '62000',
    address: '321 Finance Street, Chennai, Tamil Nadu 600001',
    isDemo: 1,
    createdAt: new Date('2021-09-01').toISOString(),
  },
  {
    id: 'EMP-DEMO-005',
    fullName: 'Eva Williams',
    email: 'eva.williams@demo.com',
    phone: '5432109876',
    gender: 'Female',
    dob: '1998-12-05',
    department: 'Design',
    designation: 'UI/UX Designer',
    joiningDate: '2023-02-20',
    employmentType: 'Part-time',
    salary: '45000',
    address: '654 Creative Lane, Pune, Maharashtra 411001',
    isDemo: 1,
    createdAt: new Date('2023-02-20').toISOString(),
  },
];

// Initialize database
export const db = new DatabaseSync(DB_FILE);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender TEXT NOT NULL,
    dob TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    joiningDate TEXT NOT NULL,
    employmentType TEXT NOT NULL,
    salary TEXT NOT NULL,
    address TEXT NOT NULL,
    isDemo INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

// Check count and seed demo data if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM employees');
const { count } = countStmt.get();

if (count === 0) {
  const insertStmt = db.prepare(`
    INSERT INTO employees (id, fullName, email, phone, gender, dob, department, designation, joiningDate, employmentType, salary, address, isDemo, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const emp of DEMO_EMPLOYEES) {
    insertStmt.run(
      emp.id,
      emp.fullName,
      emp.email,
      emp.phone,
      emp.gender,
      emp.dob,
      emp.department,
      emp.designation,
      emp.joiningDate,
      emp.employmentType,
      emp.salary,
      emp.address,
      emp.isDemo,
      emp.createdAt
    );
  }
  console.log(`[Database] Initialized and seeded with ${DEMO_EMPLOYEES.length} demo records at ${DB_FILE}`);
} else {
  console.log(`[Database] Loaded existing database with ${count} records from ${DB_FILE}`);
}

export function getAllEmployees() {
  const stmt = db.prepare('SELECT * FROM employees ORDER BY createdAt DESC');
  const rows = stmt.all();
  return rows.map(r => ({ ...r, isDemo: Boolean(r.isDemo) }));
}

export function getEmployeeById(id) {
  const stmt = db.prepare('SELECT * FROM employees WHERE id = ?');
  const row = stmt.get(id);
  if (!row) return null;
  return { ...row, isDemo: Boolean(row.isDemo) };
}

export function insertEmployee(emp) {
  const stmt = db.prepare(`
    INSERT INTO employees (id, fullName, email, phone, gender, dob, department, designation, joiningDate, employmentType, salary, address, isDemo, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    emp.id,
    emp.fullName,
    emp.email,
    emp.phone,
    emp.gender,
    emp.dob,
    emp.department,
    emp.designation,
    emp.joiningDate,
    emp.employmentType,
    String(emp.salary),
    emp.address,
    emp.isDemo ? 1 : 0,
    emp.createdAt || new Date().toISOString()
  );
  return getEmployeeById(emp.id);
}

export function updateEmployee(id, emp) {
  const stmt = db.prepare(`
    UPDATE employees
    SET fullName = ?, email = ?, phone = ?, gender = ?, dob = ?, department = ?, designation = ?, joiningDate = ?, employmentType = ?, salary = ?, address = ?
    WHERE id = ?
  `);
  stmt.run(
    emp.fullName,
    emp.email,
    emp.phone,
    emp.gender,
    emp.dob,
    emp.department,
    emp.designation,
    emp.joiningDate,
    emp.employmentType,
    String(emp.salary),
    emp.address,
    id
  );
  return getEmployeeById(id);
}

export function deleteEmployee(id) {
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
  stmt.run(id);
  return true;
}

export function clearAllEmployees() {
  db.exec('DELETE FROM employees');
  return true;
}
