import pool from '../config/db.js';

/**
 * GET /api/employee/profile
 * Returns authenticated employee's profile
 */
export async function getMyProfile(req, res) {
  try {
    const employeeId = req.user.id;
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, department, designation, salary, is_active, role FROM employees WHERE id = ?',
      [employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: error.message });
  }
}

/**
 * GET /api/employee/attendance
 * Returns attendance history for authenticated employee
 */
export async function getMyAttendance(req, res) {
  try {
    const employeeId = req.user.id;
    const { status, date } = req.query;

    let query = `
      SELECT 
        id,
        employee_id,
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        status,
        check_in,
        check_out,
        TIMEDIFF(check_out, check_in) as working_duration,
        ROUND(TIME_TO_SEC(TIMEDIFF(check_out, check_in)) / 3600, 1) as working_hours,
        notes,
        created_at
      FROM attendance
      WHERE employee_id = ?
    `;
    const params = [employeeId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    query += ' ORDER BY date DESC, id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: error.message });
  }
}

/**
 * GET /api/employee/tasks
 * Returns tasks assigned exclusively to authenticated employee
 */
export async function getMyTasks(req, res) {
  try {
    const employeeId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        id,
        employee_id,
        title,
        description,
        status,
        priority,
        DATE_FORMAT(due_date, '%Y-%m-%d') as due_date,
        created_at,
        CASE 
          WHEN status != 'Completed' AND due_date < CURDATE() THEN 1 
          ELSE 0 
        END as is_overdue
      FROM tasks
      WHERE employee_id = ?
    `;
    const params = [employeeId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY due_date ASC, id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks.', error: error.message });
  }
}

/**
 * PATCH /api/employee/tasks/:id/status
 * Employee updates task status (can only update their own task)
 */
export async function updateMyTaskStatus(req, res) {
  try {
    const employeeId = req.user.id;
    const taskId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const ALLOWED = ['Pending', 'In Progress', 'Completed'];
    if (!status || !ALLOWED.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Permitted values: Pending, In Progress, Completed.',
      });
    }

    // Verify task exists and belongs to this employee
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ? AND employee_id = ?', [taskId, employeeId]);
    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update tasks assigned to your account.',
      });
    }

    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);

    const [updated] = await pool.query(`
      SELECT 
        id,
        employee_id,
        title,
        description,
        status,
        priority,
        DATE_FORMAT(due_date, '%Y-%m-%d') as due_date,
        created_at
      FROM tasks WHERE id = ?
    `, [taskId]);

    return res.status(200).json({
      success: true,
      message: `Task status updated to "${status}".`,
      data: updated[0],
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task status.', error: error.message });
  }
}

/**
 * GET /api/employee/dashboard/stats
 * Return personal live stats for the authenticated employee
 */
export async function getMyDashboardStats(req, res) {
  try {
    const employeeId = req.user.id;

    // 1. Employee personal info
    const [empRows] = await pool.query('SELECT id, name, email, department, designation FROM employees WHERE id = ?', [employeeId]);
    if (empRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    const profile = empRows[0];

    // 2. Today's attendance status
    const [todayAttRows] = await pool.query(`
      SELECT id, status, check_in, check_out, notes
      FROM attendance
      WHERE employee_id = ? AND date = CURDATE()
    `, [employeeId]);

    const todayAttendance = todayAttRows.length > 0 ? todayAttRows[0] : null;

    // 3. Task metrics for this employee
    const [taskStatsRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingTasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgressTasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN status != 'Completed' AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdueTasks
      FROM tasks
      WHERE employee_id = ?
    `, [employeeId]);

    const taskStats = taskStatsRows[0] || {};

    // 4. Recent attendance records (latest 5)
    const [recentAttendance] = await pool.query(`
      SELECT id, DATE_FORMAT(date, '%Y-%m-%d') as date, status, check_in, check_out, notes
      FROM attendance
      WHERE employee_id = ?
      ORDER BY date DESC, id DESC
      LIMIT 5
    `, [employeeId]);

    // 5. Recent assigned tasks (latest 5)
    const [recentTasks] = await pool.query(`
      SELECT 
        id, title, description, status, priority, DATE_FORMAT(due_date, '%Y-%m-%d') as due_date,
        CASE WHEN status != 'Completed' AND due_date < CURDATE() THEN 1 ELSE 0 END as is_overdue
      FROM tasks
      WHERE employee_id = ?
      ORDER BY id DESC
      LIMIT 5
    `, [employeeId]);

    // 6. Leave stats for this employee
    const [leaveStatsRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalLeaves,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pendingLeaves,
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END), 0) as approvedLeaves,
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN days ELSE 0 END), 0) as approvedLeaveDays
      FROM leaves
      WHERE employee_id = ?
    `, [employeeId]);
    const leaveStats = leaveStatsRows[0] || {};

    const [recentLeaves] = await pool.query(`
      SELECT id, leave_type, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, days, status, reason, admin_remarks, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at
      FROM leaves
      WHERE employee_id = ?
      ORDER BY id DESC
      LIMIT 4
    `, [employeeId]);

    return res.status(200).json({
      success: true,
      profile,
      todayAttendance,
      totalTasks: Number(taskStats.totalTasks || 0),
      pendingTasks: Number(taskStats.pendingTasks || 0),
      inProgressTasks: Number(taskStats.inProgressTasks || 0),
      completedTasks: Number(taskStats.completedTasks || 0),
      overdueTasks: Number(taskStats.overdueTasks || 0),
      totalLeaves: Number(leaveStats.totalLeaves || 0),
      pendingLeaves: Number(leaveStats.pendingLeaves || 0),
      approvedLeaves: Number(leaveStats.approvedLeaves || 0),
      approvedLeaveDays: Number(leaveStats.approvedLeaveDays || 0),
      recentAttendance,
      recentTasks,
      recentLeaves,
    });
  } catch (error) {
    console.error('Error fetching employee dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to load personal dashboard.', error: error.message });
  }
}

/**
 * POST /api/attendance/check-in
 * Employee records arrival check-in using server time
 */
export async function employeeCheckIn(req, res) {
  try {
    const employeeId = req.user.id;

    // Check if attendance record already exists for today
    const [existing] = await pool.query(
      'SELECT id, check_in, status FROM attendance WHERE employee_id = ? AND date = CURDATE()',
      [employeeId]
    );

    if (existing.length > 0 && existing[0].check_in) {
      return res.status(409).json({
        success: false,
        message: `You have already checked in today at ${existing[0].check_in}.`,
      });
    }

    if (existing.length > 0) {
      // Update check_in on existing record
      await pool.query(
        'UPDATE attendance SET check_in = CURTIME(), status = "Present" WHERE id = ?',
        [existing[0].id]
      );
    } else {
      // Insert new attendance record
      await pool.query(`
        INSERT INTO attendance (employee_id, date, status, check_in)
        VALUES (?, CURDATE(), 'Present', CURTIME())
      `, [employeeId]);
    }

    const [updated] = await pool.query(`
      SELECT id, DATE_FORMAT(date, '%Y-%m-%d') as date, status, check_in, check_out
      FROM attendance
      WHERE employee_id = ? AND date = CURDATE()
    `, [employeeId]);

    return res.status(200).json({
      success: true,
      message: 'Check-in recorded successfully.',
      data: updated[0],
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ success: false, message: 'Check-in failed.', error: error.message });
  }
}

/**
 * POST /api/attendance/check-out
 * Employee records departure check-out using server time
 */
export async function employeeCheckOut(req, res) {
  try {
    const employeeId = req.user.id;

    const [existing] = await pool.query(
      'SELECT id, check_in, check_out FROM attendance WHERE employee_id = ? AND date = CURDATE()',
      [employeeId]
    );

    if (existing.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today. Please check in first.',
      });
    }

    if (existing[0].check_out) {
      return res.status(409).json({
        success: false,
        message: `You have already checked out today at ${existing[0].check_out}.`,
      });
    }

    await pool.query('UPDATE attendance SET check_out = CURTIME() WHERE id = ?', [existing[0].id]);

    const [updated] = await pool.query(`
      SELECT 
        id, 
        DATE_FORMAT(date, '%Y-%m-%d') as date, 
        status, 
        check_in, 
        check_out,
        TIMEDIFF(check_out, check_in) as working_duration,
        ROUND(TIME_TO_SEC(TIMEDIFF(check_out, check_in)) / 3600, 1) as working_hours
      FROM attendance
      WHERE id = ?
    `, [existing[0].id]);

    const durationStr = updated[0]?.working_duration || 'Calculated';

    return res.status(200).json({
      success: true,
      message: `Check-out recorded successfully! Total recorded duration: ${durationStr}`,
      data: updated[0],
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return res.status(500).json({ success: false, message: 'Check-out failed.', error: error.message });
  }
}
