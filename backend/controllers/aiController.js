import pool from '../config/db.js';

/**
 * GET /api/ai/insights
 * Generates transparent rule-augmented AI Workforce Insights from live MySQL emp_db data
 */
export async function getAIWorkforceInsights(req, res) {
  try {
    // 1. Gather live workforce metrics from emp_db
    const [empRows] = await pool.query(`
      SELECT 
        e.id, e.name, e.department, e.designation,
        COUNT(t.id) as active_tasks_count,
        SUM(CASE WHEN t.priority = 'Urgent' OR t.priority = 'High' THEN 1 ELSE 0 END) as high_priority_count
      FROM employees e
      LEFT JOIN tasks t ON e.id = t.employee_id AND t.status != 'Completed'
      GROUP BY e.id
    `);

    const totalEmployees = empRows.length;

    // 2. Attendance stats today
    const [attRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as presentToday,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absentToday,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as lateToday,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as leaveToday,
        COUNT(*) as totalMarked
      FROM attendance
      WHERE date = CURDATE()
    `);
    const presentToday = Number(attRows[0]?.presentToday || 0);
    const absentToday = Number(attRows[0]?.absentToday || 0);
    const lateToday = Number(attRows[0]?.lateToday || 0);
    const leaveToday = Number(attRows[0]?.leaveToday || 0);

    // 3. Task risk metrics
    const [taskRows] = await pool.query(`
      SELECT 
        t.id, t.title, t.priority, t.status, 
        DATE_FORMAT(t.due_date, '%Y-%m-%d') as due_date,
        DATEDIFF(t.due_date, CURDATE()) as days_until_due,
        e.name as employee_name, e.department as employee_department
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.status != 'Completed'
      ORDER BY t.due_date ASC, t.priority DESC
    `);

    // 4. Leave requests
    const [pendingLeaves] = await pool.query(`
      SELECT COUNT(*) as pendingCount FROM leaves WHERE status = 'Pending'
    `);
    const pendingLeaveCount = Number(pendingLeaves[0]?.pendingCount || 0);

    // -------------------------------------------------------------
    // AI SYNTHESIS ALGORITHMS (Deterministic & Grounded in emp_db)
    // -------------------------------------------------------------

    // Health Score calculation (0 to 100)
    let healthScore = 85;
    if (totalEmployees > 0) {
      const attendanceRatio = presentToday / totalEmployees;
      if (attendanceRatio >= 0.8) healthScore += 10;
      else if (attendanceRatio < 0.5) healthScore -= 20;
    }

    // Identify overdue or imminent deadline risks
    const overdueTasks = taskRows.filter((t) => t.days_until_due < 0);
    const imminentTasks = taskRows.filter(
      (t) => t.days_until_due >= 0 && t.days_until_due <= 2
    );

    if (overdueTasks.length > 0) healthScore -= Math.min(25, overdueTasks.length * 5);
    healthScore = Math.max(35, Math.min(99, healthScore));

    // Workload Balance Analysis
    const overloadedEmployees = empRows.filter((e) => Number(e.active_tasks_count) >= 3);
    const availableEmployees = empRows.filter(
      (e) => Number(e.active_tasks_count) === 0 || Number(e.active_tasks_count) === 1
    );

    // Smart Reassignment Suggestions
    const smartSuggestions = [];
    if (overloadedEmployees.length > 0 && availableEmployees.length > 0) {
      const heavy = overloadedEmployees[0];
      const light = availableEmployees[0];
      smartSuggestions.push({
        id: 'sugg-rebalance-1',
        type: 'Workload Rebalancing',
        urgency: 'Medium',
        summary: `Rebalance workload: ${heavy.name} has ${heavy.active_tasks_count} active tasks while ${light.name} has only ${light.active_tasks_count}.`,
        action: `Consider shifting lower priority tasks from ${heavy.name} to ${light.name}.`,
      });
    }

    if (overdueTasks.length > 0) {
      smartSuggestions.push({
        id: 'sugg-overdue-1',
        type: 'Deadline Escalation',
        urgency: 'High',
        summary: `${overdueTasks.length} task(s) currently past deadline (e.g. "${overdueTasks[0].title}" assigned to ${overdueTasks[0].employee_name}).`,
        action: 'Review blockers with assignee or extend target deadline.',
      });
    }

    if (pendingLeaveCount > 0) {
      smartSuggestions.push({
        id: 'sugg-leave-1',
        type: 'Staffing Coverage Alert',
        urgency: 'Normal',
        summary: `${pendingLeaveCount} employee leave application(s) awaiting approval in Admin panel.`,
        action: 'Approve or reject leave requests to avoid unannounced team absences.',
      });
    }

    if (lateToday > 0) {
      smartSuggestions.push({
        id: 'sugg-punctuality-1',
        type: 'Punctuality Pattern',
        urgency: 'Low',
        summary: `${lateToday} team member(s) arrived after scheduled check-in time today.`,
        action: 'Check shift timings and traffic patterns for affected departments.',
      });
    }

    // Executive briefing text
    const attendancePercentage =
      totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    const executiveBriefing = `Workforce is currently operating at ${attendancePercentage}% capacity today with ${presentToday} present out of ${totalEmployees} total staff. There are ${overdueTasks.length} overdue task(s) and ${imminentTasks.length} task(s) approaching deadlines within 48 hours. Team readiness score is rated at ${healthScore}/100.`;

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      model: 'Operational Workforce Analytics Engine',
      disclaimer:
        'Operational metrics are computed deterministically from active MySQL emp_db records.',
      healthScore,
      executiveBriefing,
      riskLevel:
        overdueTasks.length > 2
          ? 'Elevated Risk'
          : overdueTasks.length > 0
          ? 'Moderate Risk'
          : 'Optimal State',
      metrics: {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        leaveToday,
        overdueTasksCount: overdueTasks.length,
        imminentTasksCount: imminentTasks.length,
        overloadedStaffCount: overloadedEmployees.length,
        availableStaffCount: availableEmployees.length,
      },
      deadlineRisks: [...overdueTasks, ...imminentTasks].slice(0, 5),
      overloadedEmployees: overloadedEmployees.slice(0, 4),
      availableEmployees: availableEmployees.slice(0, 4),
      smartSuggestions,
    });
  } catch (error) {
    console.error('Error generating AI workforce insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI workforce insights.',
      error: error.message,
    });
  }
}
