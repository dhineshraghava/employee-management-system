import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  TrendingUp,
  Clock,
  ShieldCheck,
  RefreshCw,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react';
import { getAIInsights } from '../services/api';

export default function AIWorkforceInsights({ onActionClick }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('briefing'); // 'briefing' | 'risks' | 'workload' | 'recommendations'
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAIInsights();
      if (res.data?.success) {
        setInsights(res.data);
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      setError('Unable to fetch live AI insights from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 45000); // 45s periodic refresh
    return () => clearInterval(interval);
  }, [fetchInsights]);

  if (loading && !insights) {
    return (
      <div className="ai-insights-card loading-state">
        <div className="flex-align-center gap-10">
          <Sparkles className="spin-icon text-purple" size={20} />
          <span className="text-sm font-semibold text-secondary">
            AI Workforce Intelligence Engine analyzing live attendance & task records...
          </span>
        </div>
      </div>
    );
  }

  if (error && !insights) {
    return null;
  }

  const {
    healthScore = 85,
    executiveBriefing = '',
    riskLevel = 'Optimal State',
    metrics = {},
    deadlineRisks = [],
    overloadedEmployees = [],
    availableEmployees = [],
    smartSuggestions = [],
  } = insights || {};

  return (
    <div className="ai-insights-card">
      {/* Header with AI Gradient Banner */}
      <div className="ai-card-header">
        <div className="ai-brand-group">
          <div className="ai-avatar-badge">
            <Sparkles size={20} className="icon-ai-glow" />
          </div>
          <div>
            <div className="flex-align-center gap-8">
              <h3 className="ai-card-title">AI Workforce Intelligence</h3>
              <span className="ai-chip-pill">Live AI Analytics</span>
            </div>
            <p className="ai-card-subtitle">
              Continuous predictive analysis & workload optimization grounded in <code>emp_db</code>
            </p>
          </div>
        </div>

        <div className="ai-header-controls">
          <div className="health-score-badge">
            <span className="score-label">Team Health:</span>
            <strong className={`score-value ${healthScore >= 80 ? 'green' : 'amber'}`}>
              {healthScore}/100
            </strong>
          </div>

          <button
            type="button"
            className="btn-ai-refresh"
            onClick={fetchInsights}
            disabled={loading}
            title="Re-run AI analysis"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Analyze</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="ai-tabs-bar">
        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'briefing' ? 'active' : ''}`}
          onClick={() => setActiveTab('briefing')}
        >
          <Bot size={15} />
          <span>Executive Briefing</span>
        </button>

        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <AlertTriangle size={15} />
          <span>Deadline Risks ({deadlineRisks.length})</span>
        </button>

        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'workload' ? 'active' : ''}`}
          onClick={() => setActiveTab('workload')}
        >
          <Users size={15} />
          <span>Workload Balance ({overloadedEmployees.length} Overloaded)</span>
        </button>

        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Zap size={15} />
          <span>Smart Actions ({smartSuggestions.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Executive Briefing */}
      {activeTab === 'briefing' && (
        <div className="ai-tab-pane">
          <div className="executive-briefing-box">
            <div className="briefing-icon-column">
              <Bot size={28} className="text-purple" />
            </div>
            <div className="briefing-text-content">
              <p className="briefing-p">{executiveBriefing}</p>
              <div className="briefing-highlights-row">
                <span className="highlight-tag blue">
                  Capacity: {metrics.presentToday}/{metrics.totalEmployees} Present
                </span>
                <span className={`highlight-tag ${metrics.overdueTasksCount > 0 ? 'red' : 'green'}`}>
                  {metrics.overdueTasksCount} Overdue Task{metrics.overdueTasksCount === 1 ? '' : 's'}
                </span>
                <span className="highlight-tag purple">
                  {metrics.imminentTasksCount} Due within 48h
                </span>
                <span className="highlight-tag teal">Status: {riskLevel}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Deadline Risk Radar */}
      {activeTab === 'risks' && (
        <div className="ai-tab-pane">
          {deadlineRisks.length === 0 ? (
            <div className="ai-empty-notice">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <span>Zero overdue or critical risk tasks detected! All assigned items are on schedule.</span>
            </div>
          ) : (
            <div className="ai-risks-grid">
              {deadlineRisks.map((task) => (
                <div
                  key={task.id}
                  className={`ai-risk-item ${task.days_until_due < 0 ? 'urgent-border' : ''}`}
                >
                  <div className="risk-item-header">
                    <span className={`risk-pill ${task.days_until_due < 0 ? 'overdue' : 'imminent'}`}>
                      {task.days_until_due < 0
                        ? `Overdue by ${Math.abs(task.days_until_due)} day(s)`
                        : task.days_until_due === 0
                        ? 'Due Today!'
                        : `Due in ${task.days_until_due} day(s)`}
                    </span>
                    <span className="text-xs font-bold text-muted">Priority: {task.priority}</span>
                  </div>

                  <h4 className="risk-task-title">{task.title}</h4>
                  <p className="risk-task-assignee">
                    Assignee: <strong>{task.employee_name}</strong> ({task.employee_department})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Workload Balance */}
      {activeTab === 'workload' && (
        <div className="ai-tab-pane">
          <div className="workload-two-columns">
            <div className="workload-column">
              <h4 className="column-title text-danger">
                Overloaded Team Members (&ge; 3 active tasks)
              </h4>
              {overloadedEmployees.length === 0 ? (
                <p className="text-xs text-muted">No employees are currently over-allocated.</p>
              ) : (
                overloadedEmployees.map((e) => (
                  <div key={e.id} className="workload-person-row alert">
                    <div>
                      <strong>{e.name}</strong>
                      <span className="text-xs text-muted block">{e.designation} ({e.department})</span>
                    </div>
                    <span className="workload-count-badge heavy">{e.active_tasks_count} Active</span>
                  </div>
                ))
              )}
            </div>

            <div className="workload-column">
              <h4 className="column-title text-success">
                Available Team Capacity (&le; 1 active task)
              </h4>
              {availableEmployees.length === 0 ? (
                <p className="text-xs text-muted">All team members are fully engaged.</p>
              ) : (
                availableEmployees.map((e) => (
                  <div key={e.id} className="workload-person-row ok">
                    <div>
                      <strong>{e.name}</strong>
                      <span className="text-xs text-muted block">{e.designation} ({e.department})</span>
                    </div>
                    <span className="workload-count-badge light">{e.active_tasks_count} Active</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Smart Actions */}
      {activeTab === 'recommendations' && (
        <div className="ai-tab-pane">
          <div className="suggestions-list">
            {smartSuggestions.map((item) => (
              <div key={item.id} className="suggestion-item">
                <div className="flex-between mb-1">
                  <div className="flex-align-center gap-6">
                    <span className={`urgency-dot ${item.urgency.toLowerCase()}`}></span>
                    <strong className="text-sm text-navy-900">{item.type}</strong>
                  </div>
                  <span className={`urgency-badge ${item.urgency.toLowerCase()}`}>
                    {item.urgency} Urgency
                  </span>
                </div>
                <p className="suggestion-summary">{item.summary}</p>
                <div className="suggestion-action-box">
                  <span className="action-label">Recommendation:</span>
                  <span className="action-text">{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grounding & Ethics Footer */}
      <div className="ai-card-footer">
        <Info size={13} className="text-muted" />
        <span>
          Grounding note: Insights generated from live MySQL <code>emp_db</code>. AI recommendations are advisory and do not alter records without admin confirmation.
        </span>
      </div>
    </div>
  );
}
