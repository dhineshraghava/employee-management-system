import pool from '../config/db.js';

const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Completed'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

/**
 * GET /api/tasks
 * Retrieve tasks and associated employee information
 * Supports filters: ?employee_id= & ?status= & ?priority= & ?search=
 */
export async function getAllTasks(req, res) {
  try {
    const { employee_id, status, priority, search } = req.query;

    let query = `
      SELECT 
        t.id,
        t.employee_id,
        t.title,
        t.description,
        t.status,
        t.priority,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') as due_date,
        t.created_at,
        CASE 
          WHEN t.status != 'Completed' AND t.due_date < CURDATE() THEN 1 
          ELSE 0 
        END as is_overdue,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      query += ' AND t.employee_id = ?';
      params.push(parseInt(employee_id, 10));
    }

    if (status && ALLOWED_STATUSES.includes(status)) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && ALLOWED_PRIORITIES.includes(priority)) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (t.title LIKE ? OR t.description LIKE ? OR e.name LIKE ?)';
      params.push(term, term, term);
    }

    query += ' ORDER BY t.due_date ASC, t.id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks.',
      error: error.message,
    });
  }
}

/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID
 */
export async function getTaskById(req, res) {
  try {
    const { id } = req.params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const query = `
      SELECT 
        t.id,
        t.employee_id,
        t.title,
        t.description,
        t.status,
        t.priority,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') as due_date,
        t.created_at,
        CASE 
          WHEN t.status != 'Completed' AND t.due_date < CURDATE() THEN 1 
          ELSE 0 
        END as is_overdue,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.id = ?
    `;
    const [rows] = await pool.query(query, [taskId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve task details.',
      error: error.message,
    });
  }
}

/**
 * POST /api/tasks
 * Create a new task and assign to employee
 */
export async function createTask(req, res) {
  try {
    const { employee_id, title, description, status, priority, due_date } = req.body;

    const empId = parseInt(employee_id, 10);
    if (isNaN(empId)) {
      return res.status(400).json({ success: false, message: 'Valid employee ID is required.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    // Verify employee exists in MySQL
    const [emp] = await pool.query('SELECT id, name FROM employees WHERE id = ?', [empId]);
    if (emp.length === 0) {
      return res.status(404).json({ success: false, message: `Employee with ID ${empId} not found.` });
    }

    const cleanTitle = title.trim();
    const cleanDesc = description ? description.trim() : null;
    const cleanStatus = status && ALLOWED_STATUSES.includes(status) ? status : 'Pending';
    const cleanPriority = priority && ALLOWED_PRIORITIES.includes(priority) ? priority : 'Medium';
    const cleanDueDate = due_date || null;

    const insertSql = `
      INSERT INTO tasks (employee_id, title, description, status, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertSql, [
      empId,
      cleanTitle,
      cleanDesc,
      cleanStatus,
      cleanPriority,
      cleanDueDate,
    ]);

    const [newRow] = await pool.query(`
      SELECT 
        t.id,
        t.employee_id,
        t.title,
        t.description,
        t.status,
        t.priority,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') as due_date,
        t.created_at,
        e.name as employee_name
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.id = ?
    `, [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Task created and assigned successfully.',
      data: newRow[0],
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task.',
      error: error.message,
    });
  }
}

/**
 * PUT /api/tasks/:id
 * Update an existing task
 */
export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { employee_id, title, description, status, priority, due_date } = req.body;

    let targetEmpId = existing[0].employee_id;
    if (employee_id !== undefined) {
      const parsedEmpId = parseInt(employee_id, 10);
      if (!isNaN(parsedEmpId)) {
        const [emp] = await pool.query('SELECT id FROM employees WHERE id = ?', [parsedEmpId]);
        if (emp.length === 0) {
          return res.status(404).json({ success: false, message: `Employee with ID ${parsedEmpId} not found.` });
        }
        targetEmpId = parsedEmpId;
      }
    }

    const targetTitle = title ? title.trim() : existing[0].title;
    const targetDesc = description !== undefined ? description : existing[0].description;
    const targetStatus = status && ALLOWED_STATUSES.includes(status) ? status : existing[0].status;
    const targetPriority = priority && ALLOWED_PRIORITIES.includes(priority) ? priority : existing[0].priority;
    const targetDueDate = due_date !== undefined ? due_date : existing[0].due_date;

    const updateSql = `
      UPDATE tasks
      SET employee_id = ?, title = ?, description = ?, status = ?, priority = ?, due_date = ?
      WHERE id = ?
    `;
    await pool.query(updateSql, [
      targetEmpId,
      targetTitle,
      targetDesc,
      targetStatus,
      targetPriority,
      targetDueDate,
      taskId,
    ]);

    const [updated] = await pool.query(`
      SELECT 
        t.id,
        t.employee_id,
        t.title,
        t.description,
        t.status,
        t.priority,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') as due_date,
        t.created_at,
        CASE 
          WHEN t.status != 'Completed' AND t.due_date < CURDATE() THEN 1 
          ELSE 0 
        END as is_overdue,
        e.name as employee_name
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.id = ?
    `, [taskId]);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task.',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const [existing] = await pool.query('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    return res.status(200).json({
      success: true,
      message: `Task #${taskId} deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task.',
      error: error.message,
    });
  }
}
