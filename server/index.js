import express from 'express';
import cors from 'cors';
import {
  getAllEmployees,
  getEmployeeById,
  insertEmployee,
  updateEmployee,
  deleteEmployee,
  clearAllEmployees,
} from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'SQLite (native)',
    timestamp: new Date().toISOString(),
  });
});

// GET all employees
app.get('/api/employees', (req, res) => {
  try {
    const employees = getAllEmployees();
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees from database' });
  }
});

// GET employee by ID
app.get('/api/employees/:id', (req, res) => {
  try {
    const employee = getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST create employee
app.post('/api/employees', (req, res) => {
  try {
    const employeeData = req.body;
    if (!employeeData.id || !employeeData.fullName || !employeeData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = getEmployeeById(employeeData.id);
    if (existing) {
      return res.status(409).json({ error: 'Employee ID already exists' });
    }

    const newEmp = insertEmployee(employeeData);
    res.status(201).json(newEmp);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to insert employee into database' });
  }
});

// PUT update employee
app.put('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = getEmployeeById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updated = updateEmployee(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee in database' });
  }
});

// DELETE single employee
app.delete('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = getEmployeeById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    deleteEmployee(id);
    res.json({ success: true, message: `Employee ${id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee from database' });
  }
});

// DELETE clear all employees
app.delete('/api/employees', (req, res) => {
  try {
    clearAllEmployees();
    res.json({ success: true, message: 'All employees cleared from database' });
  } catch (error) {
    console.error('Error clearing employees:', error);
    res.status(500).json({ error: 'Failed to clear employees from database' });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Employee Backend Database Server running!`);
  console.log(`📍 API URL: http://localhost:${PORT}/api/employees`);
  console.log(`💾 Database: SQLite (employees.sqlite)`);
  console.log(`===============================================`);
});
