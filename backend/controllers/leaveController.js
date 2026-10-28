import pool from '../config/db.js';

/**
 * Helper to generate array of date strings between start and end (inclusive)
 */
function getDateRange(startDateStr, endDateStr) {
  const dates = [];
  const current = new Date(startDateStr);
  const end = new Date(endDateStr);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// =========================================================================
// EMPLOYEE ACTIONS
// =========================================================================

/**
 * POST /api/leaves/apply
 * Employee applies for leave
 */
export async function applyLeave(req, res) {
  try {
    const employeeId = req.user.id;
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, end date, and reason are all required.',
      });
    }

    const startDate = new Date(start_date + 'T00:00:00');
    const endDate = new Date(end_date + 'T00:00:00');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date or end date format. Please use YYYY-MM-DD.',
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.',
      });
    }

    // Calculate days inclusive
    const diffTime = endDate.getTime() - startDate.getTime();
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Leave duration must be at least 1 day.',
      });
    }

    // Check for overlapping active leave requests (Pending or Approved)
    const [overlapping] = await pool.query(
      `SELECT id, status, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date 
       FROM leaves 
       WHERE employee_id = ? 
         AND status IN ('Pending', 'Approved') 
         AND (
           (start_date <= ? AND end_date >= ?) OR
           (start_date <= ? AND end_date >= ?) OR
           (start_date >= ? AND end_date <= ?)
         )`,
      [employeeId, start_date, start_date, end_date, end_date, start_date, end_date]
    );

    if (overlapping.length > 0) {
      const match = overlapping[0];
      return res.status(409).json({
        success: false,
        message: `You already have an existing ${match.status} leave request covering ${match.start_date} to ${match.end_date}.`,
      });
    }

    const validTypes = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Paid Leave', 'Emergency Leave', 'Unpaid Leave'];
    const chosenType = validTypes.includes(leave_type) ? leave_type : 'Casual Leave';

    const [result] = await pool.query(
      `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [employeeId, chosenType, start_date, end_date, days, reason.trim()]
    );

    const [newLeaveRows] = await pool.query(
      `SELECT 
        l.id,
        l.employee_id,
        l.leave_type,
        DATE_FORMAT(l.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(l.end_date, '%Y-%m-%d') as end_date,
        l.days,
        l.reason,
        l.status,
        l.admin_remarks,
        DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i') as created_at
       FROM leaves l 
       WHERE l.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully! It is now pending admin review.',
      leave: newLeaveRows[0],
    });
  } catch (error) {
    console.error('Error applying for leave:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit leave application.',
      error: error.message,
    });
  }
}

/**
 * GET /api/leaves/my
 * Returns leave history for authenticated employee
 */
export async function getMyLeaves(req, res) {
  try {
    const employeeId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        id,
        employee_id,
        leave_type,
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        days,
        reason,
        status,
        admin_remarks,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') as updated_at
       FROM leaves 
       WHERE employee_id = ? 
       ORDER BY id DESC`,
      [employeeId]
    );

    const summary = {
      total: rows.length,
      pending: rows.filter((r) => r.status === 'Pending').length,
      approved: rows.filter((r) => r.status === 'Approved').length,
      rejected: rows.filter((r) => r.status === 'Rejected').length,
      approvedDays: rows
        .filter((r) => r.status === 'Approved')
        .reduce((sum, r) => sum + Number(r.days || 0), 0),
    };

    return res.status(200).json({
      success: true,
      leaves: rows,
      summary,
    });
  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your leave records.',
      error: error.message,
    });
  }
}

/**
 * PATCH /api/leaves/my/:id/cancel
 * Employee cancels their pending leave application
 */
export async function cancelMyLeave(req, res) {
  try {
    const employeeId = req.user.id;
    const leaveId = req.params.id;

    const [existing] = await pool.query(
      'SELECT id, status FROM leaves WHERE id = ? AND employee_id = ?',
      [leaveId, employeeId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.',
      });
    }

    if (existing[0].status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Only 'Pending' leave requests can be cancelled. Current status is '${existing[0].status}'.`,
      });
    }

    await pool.query(
      "UPDATE leaves SET status = 'Cancelled' WHERE id = ? AND employee_id = ?",
      [leaveId, employeeId]
    );

    return res.status(200).json({
      success: true,
      message: 'Leave application has been cancelled.',
    });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel leave application.',
      error: error.message,
    });
  }
}

// =========================================================================
// ADMIN ACTIONS
// =========================================================================

/**
 * GET /api/leaves
 * Admin gets all employee leave requests with filtering
 */
export async function getAllLeaves(req, res) {
  try {
    const { status, search, department } = req.query;

    let query = `
      SELECT 
        l.id,
        l.employee_id,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department,
        e.designation as employee_designation,
        e.phone as employee_phone,
        l.leave_type,
        DATE_FORMAT(l.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(l.end_date, '%Y-%m-%d') as end_date,
        l.days,
        l.reason,
        l.status,
        l.admin_remarks,
        DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i') as created_at,
        DATE_FORMAT(l.updated_at, '%Y-%m-%d %H:%i') as updated_at
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ' AND l.status = ?';
      params.push(status);
    }

    if (department && department !== 'All') {
      query += ' AND e.department = ?';
      params.push(department);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (e.name LIKE ? OR e.email LIKE ? OR l.reason LIKE ? OR l.leave_type LIKE ?)';
      params.push(term, term, term, term);
    }

    query += ' ORDER BY CASE WHEN l.status = "Pending" THEN 0 ELSE 1 END, l.created_at DESC, l.id DESC';

    const [rows] = await pool.query(query, params);

    // Summary counts for Admin header
    const [allCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM leaves
    `);

    const summary = {
      total: allCounts[0]?.total || 0,
      pending: allCounts[0]?.pending || 0,
      approved: allCounts[0]?.approved || 0,
      rejected: allCounts[0]?.rejected || 0,
    };

    return res.status(200).json({
      success: true,
      leaves: rows,
      summary,
    });
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave records from database.',
      error: error.message,
    });
  }
}

/**
 * PATCH /api/leaves/:id/status
 * Admin approves or rejects an employee's leave request
 */
export async function updateLeaveStatus(req, res) {
  try {
    const leaveId = req.params.id;
    const { status, admin_remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Approved' or 'Rejected'.",
      });
    }

    const [existing] = await pool.query(
      `SELECT 
        l.id,
        l.employee_id,
        l.leave_type,
        DATE_FORMAT(l.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(l.end_date, '%Y-%m-%d') as end_date,
        l.status,
        e.name as employee_name
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       WHERE l.id = ?`,
      [leaveId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.',
      });
    }

    const leave = existing[0];
    const remarks = admin_remarks && admin_remarks.trim() ? admin_remarks.trim() : null;

    // Update leave record in MySQL
    await pool.query(
      'UPDATE leaves SET status = ?, admin_remarks = ? WHERE id = ?',
      [status, remarks, leaveId]
    );

    // Synchronize with attendance records:
    // If Approved: automatically insert or update attendance records for those dates as 'Leave'
    if (status === 'Approved') {
      const dates = getDateRange(leave.start_date, leave.end_date);
      for (const d of dates) {
        await pool.query(
          `INSERT INTO attendance (employee_id, date, status, notes)
           VALUES (?, ?, 'Leave', ?)
           ON DUPLICATE KEY UPDATE status = 'Leave', notes = VALUES(notes)`,
          [leave.employee_id, d, `Approved Leave: ${leave.leave_type}`]
        );
      }
    } else if (status === 'Rejected' && leave.status === 'Approved') {
      // If it was previously approved and is now rejected, reset those attendance notes
      const dates = getDateRange(leave.start_date, leave.end_date);
      for (const d of dates) {
        await pool.query(
          `DELETE FROM attendance WHERE employee_id = ? AND date = ? AND status = 'Leave' AND notes LIKE 'Approved Leave:%'`,
          [leave.employee_id, d]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Leave request for ${leave.employee_name} has been ${status.toLowerCase()}!`,
      status,
      admin_remarks: remarks,
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update leave status.',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/leaves/:id
 * Admin deletes a leave record
 */
export async function deleteLeave(req, res) {
  try {
    const leaveId = req.params.id;

    const [existing] = await pool.query('SELECT * FROM leaves WHERE id = ?', [leaveId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave record not found.' });
    }

    await pool.query('DELETE FROM leaves WHERE id = ?', [leaveId]);

    return res.status(200).json({
      success: true,
      message: 'Leave record deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting leave record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete leave record.',
      error: error.message,
    });
  }
}

/**
 * GET /api/leaves/summary
 * Returns count of pending leaves for badges
 */
export async function getLeaveSummary(req, res) {
  try {
    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM leaves
    `);

    return res.status(200).json({
      success: true,
      summary: {
        total: counts[0]?.total || 0,
        pending: counts[0]?.pending || 0,
        approved: counts[0]?.approved || 0,
        rejected: counts[0]?.rejected || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching leave summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave summary.',
      error: error.message,
    });
  }
}
