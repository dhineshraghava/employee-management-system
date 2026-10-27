import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/employees & /api/admin/employees
 * Retrieve all employees (optionally filtered by ?search=)
 */
export async function getAllEmployees(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT id, name, email, phone, department, designation, salary, is_active, role FROM employees';
    let params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      const isNum = !isNaN(parseInt(search.trim(), 10));

      if (isNum) {
        query += ' WHERE id = ? OR name LIKE ? OR email LIKE ? OR department LIKE ? OR phone LIKE ?';
        params = [parseInt(search.trim(), 10), term, term, term, term];
      } else {
        query += ' WHERE name LIKE ? OR email LIKE ? OR department LIKE ? OR phone LIKE ?';
        params = [term, term, term, term];
      }
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees from the database.',
      error: error.message,
    });
  }
}

/**
 * GET /api/employees/:id & /api/admin/employees/:id
 * Retrieve a single employee by ID, including their recent attendance and assigned tasks
 */
export async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format. Must be an integer.',
      });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, department, designation, salary, is_active, role FROM employees WHERE id = ?',
      [employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} was not found.`,
      });
    }

    const employee = rows[0];

    // Fetch related tasks for this employee
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE employee_id = ? ORDER BY due_date ASC, id DESC',
      [employeeId]
    );

    // Fetch recent attendance for this employee
    const [attendance] = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 10',
      [employeeId]
    );

    return res.status(200).json({
      ...employee,
      tasks,
      attendance,
    });
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee details.',
      error: error.message,
    });
  }
}

/**
 * POST /api/employees & /api/admin/employees
 * Add a new employee to MySQL with secure login credentials
 */
export async function createEmployee(req, res) {
  try {
    const { name, email, phone, department, designation, salary, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Employee name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanSalary = salary !== undefined && salary !== null && salary !== '' ? parseFloat(salary) : 0.0;
    if (isNaN(cleanSalary) || cleanSalary < 0) {
      return res.status(400).json({ success: false, message: 'Salary must be a non-negative number.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : '';
    const cleanDept = department ? department.trim() : 'General';
    const cleanDesignation = designation ? designation.trim() : 'Staff Member';

    // Validate employee login password
    if (!password || password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Employee login password is required and must be at least 6 characters long.',
      });
    }

    const rawPassword = password.trim();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const insertSql = `
      INSERT INTO employees (name, email, password, phone, department, designation, salary, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'employee', 1)
    `;
    const [result] = await pool.query(insertSql, [
      cleanName,
      cleanEmail,
      hashedPassword,
      cleanPhone,
      cleanDept,
      cleanDesignation,
      cleanSalary,
    ]);

    const [newRows] = await pool.query(
      'SELECT id, name, email, phone, department, designation, salary, role, is_active FROM employees WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: `Employee "${cleanName}" created successfully with initial password.`,
      initialPassword: rawPassword,
      data: newRows[0],
    });
  } catch (error) {
    console.error('Error creating employee:', error);

    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email address already exists. Please use a unique email.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to save employee to database.',
      error: error.message,
    });
  }
}

/**
 * PUT /api/employees/:id & /api/admin/employees/:id
 * Update an existing employee in MySQL
 */
export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID format.' });
    }

    const { name, email, phone, department, designation, salary, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: `Employee with ID ${employeeId} does not exist.` });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanSalary = salary !== undefined && salary !== null && salary !== '' ? parseFloat(salary) : 0.0;
    if (isNaN(cleanSalary) || cleanSalary < 0) {
      return res.status(400).json({ success: false, message: 'Salary must be a non-negative number.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : '';
    const cleanDept = department ? department.trim() : 'General';
    const cleanDesignation = designation !== undefined ? designation : existing[0].designation;
    const cleanActive = is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active;

    const updateSql = `
      UPDATE employees
      SET name = ?, email = ?, phone = ?, department = ?, designation = ?, salary = ?, is_active = ?
      WHERE id = ?
    `;
    await pool.query(updateSql, [
      cleanName,
      cleanEmail,
      cleanPhone,
      cleanDept,
      cleanDesignation,
      cleanSalary,
      cleanActive,
      employeeId,
    ]);

    const [updatedRows] = await pool.query(
      'SELECT id, name, email, phone, department, designation, salary, role, is_active FROM employees WHERE id = ?',
      [employeeId]
    );

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully in MySQL.',
      data: updatedRows[0],
    });
  } catch (error) {
    console.error('Error updating employee:', error);

    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({
        success: false,
        message: 'An employee with this email address already exists. Please choose another email.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update employee details.',
      error: error.message,
    });
  }
}

/**
 * POST /api/admin/employees/:id/reset-password
 * Admin resets employee login password
 */
export async function resetEmployeePassword(req, res) {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);
    const { new_password } = req.body;

    if (isNaN(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
    }

    if (!new_password || new_password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const [existing] = await pool.query('SELECT id, name FROM employees WHERE id = ?', [employeeId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const hashedPassword = await bcrypt.hash(new_password.trim(), 10);
    await pool.query('UPDATE employees SET password = ? WHERE id = ?', [hashedPassword, employeeId]);

    return res.status(200).json({
      success: true,
      message: `Password for employee "${existing[0].name}" was reset successfully.`,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.', error: error.message });
  }
}

/**
 * DELETE /api/employees/:id & /api/admin/employees/:id
 * Delete an employee from MySQL with safe foreign key constraint handling
 */
export async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID format.' });
    }

    const [existing] = await pool.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: `Employee with ID ${employeeId} not found.` });
    }

    // Check for foreign key references in attendance and tasks
    const [attRows] = await pool.query('SELECT COUNT(*) as cnt FROM attendance WHERE employee_id = ?', [employeeId]);
    const [taskRows] = await pool.query('SELECT COUNT(*) as cnt FROM tasks WHERE employee_id = ?', [employeeId]);

    const attendanceCount = attRows[0]?.cnt || 0;
    const taskCount = taskRows[0]?.cnt || 0;

    if (attendanceCount > 0 || taskCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete employee #${employeeId} (${existing[0].name}) because they have ${attendanceCount} attendance record(s) and ${taskCount} assigned task(s). Please reassign or delete these related records first to maintain database integrity.`,
      });
    }

    const deleteSql = 'DELETE FROM employees WHERE id = ?';
    await pool.query(deleteSql, [employeeId]);

    return res.status(200).json({
      success: true,
      message: `Employee #${employeeId} (${existing[0].name}) was deleted successfully from MySQL.`,
    });
  } catch (error) {
    console.error('Error deleting employee:', error);

    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete employee because related tasks or attendance records exist.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee from database.',
      error: error.message,
    });
  }
}

/**
 * GET /api/dashboard/stats & /api/admin/dashboard/stats
 * Retrieve comprehensive live dashboard statistics calculated from MySQL
 */
export async function getDashboardStats(req, res) {
  try {
    const [countRows] = await pool.query('SELECT COUNT(*) as totalEmployees FROM employees');
    const totalEmployees = Number(countRows[0]?.totalEmployees || 0);

    const [deptCountRows] = await pool.query(`
      SELECT COUNT(DISTINCT NULLIF(TRIM(department), '')) as activeDepartments
      FROM employees
    `);
    const activeDepartments = Number(deptCountRows[0]?.activeDepartments || 0);

    const [salaryRows] = await pool.query(`
      SELECT 
        COALESCE(ROUND(SUM(salary), 2), 0) as totalSalary,
        COALESCE(ROUND(AVG(salary), 2), 0) as averageSalary
      FROM employees
    `);
    const totalSalary = Number(salaryRows[0]?.totalSalary || 0);
    const averageSalary = Number(salaryRows[0]?.averageSalary || 0);

    const [deptRows] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(department), ''), 'Unassigned') as name,
        COUNT(*) as count,
        COALESCE(ROUND(AVG(salary), 2), 0) as avgSalary,
        COALESCE(ROUND(SUM(salary), 2), 0) as totalSalary
      FROM employees
      GROUP BY department
      ORDER BY count DESC
    `);

    const [attendanceTodayRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as presentToday,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absentToday,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as lateToday,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as leaveToday,
        COUNT(*) as totalMarkedToday
      FROM attendance
      WHERE date = CURDATE()
    `);
    const presentToday = Number(attendanceTodayRows[0]?.presentToday || 0);
    const absentToday = Number(attendanceTodayRows[0]?.absentToday || 0);
    const lateToday = Number(attendanceTodayRows[0]?.lateToday || 0);
    const leaveToday = Number(attendanceTodayRows[0]?.leaveToday || 0);

    const [taskStatsRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingTasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgressTasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN status != 'Completed' AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdueTasks,
        COUNT(*) as totalTasks
      FROM tasks
    `);
    const pendingTasks = Number(taskStatsRows[0]?.pendingTasks || 0);
    const inProgressTasks = Number(taskStatsRows[0]?.inProgressTasks || 0);
    const completedTasks = Number(taskStatsRows[0]?.completedTasks || 0);
    const overdueTasks = Number(taskStatsRows[0]?.overdueTasks || 0);
    const totalTasks = Number(taskStatsRows[0]?.totalTasks || 0);

    const [recentEmployees] = await pool.query('SELECT id, name, email, department, designation, salary FROM employees ORDER BY id DESC LIMIT 5');

    const [recentAttendance] = await pool.query(`
      SELECT a.*, e.name as employee_name, e.department as employee_department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      ORDER BY a.date DESC, a.id DESC
      LIMIT 5
    `);

    const [recentTasks] = await pool.query(`
      SELECT t.*, e.name as employee_name, e.department as employee_department
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      ORDER BY t.id DESC
      LIMIT 5
    `);

    const [leaveStatsRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pendingLeaves,
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END), 0) as approvedLeaves,
        COUNT(*) as totalLeaves
      FROM leaves
    `);
    const pendingLeaves = Number(leaveStatsRows[0]?.pendingLeaves || 0);
    const approvedLeaves = Number(leaveStatsRows[0]?.approvedLeaves || 0);
    const totalLeaves = Number(leaveStatsRows[0]?.totalLeaves || 0);

    const [recentLeaves] = await pool.query(`
      SELECT l.*, e.name as employee_name, e.department as employee_department
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      ORDER BY l.id DESC
      LIMIT 5
    `);

    const statsData = {
      totalEmployees,
      activeDepartments,
      averageSalary,
      totalSalary,
      presentToday,
      absentToday,
      lateToday,
      leaveToday,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      totalTasks,
      pendingLeaves,
      approvedLeaves,
      totalLeaves,
      departments: deptRows.map((d) => ({
        name: d.name,
        count: Number(d.count),
        avgSalary: Number(d.avgSalary),
        totalSalary: Number(d.totalSalary),
      })),
      recentEmployees,
      recentAttendance,
      recentTasks,
      recentLeaves,
    };

    return res.status(200).json({
      success: true,
      data: statsData,
      ...statsData,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats from MySQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics from MySQL database.',
      error: error.message,
    });
  }
}

/**
 * GET /api/admin/reports
 * Detailed reports for Admin Reports panel
 */
export async function getAdminReports(req, res) {
  try {
    // 1. Department Breakdown with Salary, Employee Count
    const [departments] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(department), ''), 'General') as department,
        COUNT(*) as total_employees,
        COALESCE(ROUND(AVG(salary), 2), 0) as avg_salary,
        COALESCE(ROUND(SUM(salary), 2), 0) as total_payroll,
        MIN(salary) as min_salary,
        MAX(salary) as max_salary
      FROM employees
      GROUP BY department
      ORDER BY total_employees DESC
    `);

    // 2. Attendance Monthly / Weekly Rate
    const [attendanceTrends] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as \`leave\`
      FROM attendance
      GROUP BY date
      ORDER BY date DESC
      LIMIT 14
    `);

    // 3. Task Status & Priority Breakdown
    const [taskPrioritySummary] = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
      FROM tasks
      GROUP BY priority
    `);

    // 4. Employee Performance: tasks assigned & completed per employee
    const [employeePerformance] = await pool.query(`
      SELECT 
        e.id,
        e.name,
        e.department,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status != 'Completed' AND t.due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_tasks,
        ROUND((SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) * 100, 1) as completion_rate
      FROM employees e
      LEFT JOIN tasks t ON e.id = t.employee_id
      GROUP BY e.id, e.name, e.department
      ORDER BY total_tasks DESC
      LIMIT 10
    `);

    return res.status(200).json({
      success: true,
      departments,
      attendanceTrends,
      taskPrioritySummary,
      employeePerformance,
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate reports.', error: error.message });
  }
}
