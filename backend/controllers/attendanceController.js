import pool from '../config/db.js';

const ALLOWED_STATUSES = ['Present', 'Absent', 'Late', 'Leave'];

/**
 * GET /api/attendance
 * Retrieve attendance records with optional filters:
 * ?employee_id= & ?date= & ?status= & ?start_date= & ?end_date=
 */
export async function getAllAttendance(req, res) {
  try {
    const { employee_id, date, status, start_date, end_date } = req.query;
    let query = `
      SELECT 
        a.id,
        a.employee_id,
        DATE_FORMAT(a.date, '%Y-%m-%d') as date,
        a.status,
        a.check_in,
        a.check_out,
        a.notes,
        a.created_at,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      query += ' AND a.employee_id = ?';
      params.push(parseInt(employee_id, 10));
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (status && ALLOWED_STATUSES.includes(status)) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (start_date) {
      query += ' AND a.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY a.date DESC, a.id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records.',
      error: error.message,
    });
  }
}

/**
 * GET /api/attendance/:id
 * Retrieve a single attendance record
 */
export async function getAttendanceById(req, res) {
  try {
    const { id } = req.params;
    const attId = parseInt(id, 10);

    if (isNaN(attId)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance ID.' });
    }

    const query = `
      SELECT 
        a.id,
        a.employee_id,
        DATE_FORMAT(a.date, '%Y-%m-%d') as date,
        a.status,
        a.check_in,
        a.check_out,
        a.notes,
        a.created_at,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ?
    `;
    const [rows] = await pool.query(query, [attId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance record.',
      error: error.message,
    });
  }
}

/**
 * POST /api/attendance
 * Create or mark an attendance record
 */
export async function createAttendance(req, res) {
  try {
    const { employee_id, date, status, check_in, check_out, notes } = req.body;

    const empId = parseInt(employee_id, 10);
    if (isNaN(empId)) {
      return res.status(400).json({ success: false, message: 'Valid employee ID is required.' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Attendance date is required.' });
    }

    const cleanStatus = status && ALLOWED_STATUSES.includes(status) ? status : 'Present';

    // Verify employee exists
    const [emp] = await pool.query('SELECT id, name FROM employees WHERE id = ?', [empId]);
    if (emp.length === 0) {
      return res.status(404).json({ success: false, message: `Employee with ID ${empId} not found.` });
    }

    // Check for duplicate attendance for this employee on this date
    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [empId, date]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Attendance for employee "${emp[0].name}" has already been recorded for date ${date}. You may update the existing record instead.`,
      });
    }

    const insertSql = `
      INSERT INTO attendance (employee_id, date, status, check_in, check_out, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertSql, [
      empId,
      date,
      cleanStatus,
      check_in || null,
      check_out || null,
      notes || null,
    ]);

    const [newRow] = await pool.query(`
      SELECT 
        a.id,
        a.employee_id,
        DATE_FORMAT(a.date, '%Y-%m-%d') as date,
        a.status,
        a.check_in,
        a.check_out,
        a.notes,
        a.created_at,
        e.name as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ?
    `, [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Attendance record saved successfully.',
      data: newRow[0],
    });
  } catch (error) {
    console.error('Error recording attendance:', error);

    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this employee on this date.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to record attendance.',
      error: error.message,
    });
  }
}

/**
 * PUT /api/attendance/:id
 * Update an existing attendance record
 */
export async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const attId = parseInt(id, 10);

    if (isNaN(attId)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance ID.' });
    }

    const [existing] = await pool.query('SELECT * FROM attendance WHERE id = ?', [attId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const { status, check_in, check_out, notes, date } = req.body;
    const targetStatus = status && ALLOWED_STATUSES.includes(status) ? status : existing[0].status;
    const targetDate = date || existing[0].date;

    const updateSql = `
      UPDATE attendance
      SET date = ?, status = ?, check_in = ?, check_out = ?, notes = ?
      WHERE id = ?
    `;
    await pool.query(updateSql, [
      targetDate,
      targetStatus,
      check_in !== undefined ? check_in : existing[0].check_in,
      check_out !== undefined ? check_out : existing[0].check_out,
      notes !== undefined ? notes : existing[0].notes,
      attId,
    ]);

    const [updated] = await pool.query(`
      SELECT 
        a.id,
        a.employee_id,
        DATE_FORMAT(a.date, '%Y-%m-%d') as date,
        a.status,
        a.check_in,
        a.check_out,
        a.notes,
        a.created_at,
        e.name as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ?
    `, [attId]);

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance record.',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/attendance/:id
 * Delete an attendance record
 */
export async function deleteAttendance(req, res) {
  try {
    const { id } = req.params;
    const attId = parseInt(id, 10);

    if (isNaN(attId)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance ID.' });
    }

    const [existing] = await pool.query('SELECT id FROM attendance WHERE id = ?', [attId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    await pool.query('DELETE FROM attendance WHERE id = ?', [attId]);
    return res.status(200).json({
      success: true,
      message: `Attendance record #${attId} deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record.',
      error: error.message,
    });
  }
}

/**
 * GET /api/attendance/summary/today
 * Today's attendance summary
 */
export async function getTodaySummary(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as \`leave\`,
        COUNT(*) as totalMarked
      FROM attendance
      WHERE date = CURDATE()
    `);

    const [empCount] = await pool.query('SELECT COUNT(*) as total FROM employees');
    const totalEmployees = Number(empCount[0]?.total || 0);
    const totalMarked = Number(rows[0]?.totalMarked || 0);

    return res.status(200).json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        totalEmployees,
        totalMarked,
        unmarked: Math.max(0, totalEmployees - totalMarked),
        present: Number(rows[0]?.present || 0),
        absent: Number(rows[0]?.absent || 0),
        late: Number(rows[0]?.late || 0),
        leave: Number(rows[0]?.leave || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching today attendance summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary.',
      error: error.message,
    });
  }
}
