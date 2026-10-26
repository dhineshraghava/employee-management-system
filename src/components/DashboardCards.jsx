import { Users, Building2, Clock, Briefcase, TrendingUp } from 'lucide-react';
import { DEPARTMENTS } from '../utils/employeeStorage';

export default function DashboardCards({ employees }) {
  const total = employees.length;
  const fullTime = employees.filter((e) => e.employmentType === 'Full-time').length;
  const partTime = employees.filter((e) => e.employmentType === 'Part-time').length;
  const contract = employees.filter((e) => e.employmentType === 'Contract').length;
  const departments = [...new Set(employees.map((e) => e.department))].length;
  const demoCount = employees.filter((e) => e.isDemo).length;

  const cards = [
    {
      label: 'Total Employees',
      value: total,
      sub: `${demoCount} demo record${demoCount !== 1 ? 's' : ''}`,
      icon: Users,
      iconBg: 'linear-gradient(135deg,#3b82f6,#6366f1)',
      accent: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    },
    {
      label: 'Departments',
      value: departments,
      sub: `of ${DEPARTMENTS.length} total`,
      icon: Building2,
      iconBg: 'linear-gradient(135deg,#14b8a6,#06b6d4)',
      accent: '#14b8a6',
    },
    {
      label: 'Full-Time',
      value: fullTime,
      sub: total ? `${Math.round((fullTime / total) * 100)}% of workforce` : '—',
      icon: Briefcase,
      iconBg: 'linear-gradient(135deg,#22c55e,#16a34a)',
      accent: '#22c55e',
    },
    {
      label: 'Contract',
      value: contract,
      sub: `${partTime} part-time`,
      icon: Clock,
      iconBg: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
      accent: '#8b5cf6',
    },
  ];

  return (
    <div className="cards-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="stat-card"
            style={{ '--card-accent': card.accent }}
          >
            <div
              className="stat-icon"
              style={{ background: card.iconBg, boxShadow: `0 8px 20px rgba(0,0,0,0.15)` }}
            >
              <Icon size={22} color="white" />
            </div>
            <div className="stat-content">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
              <p className="stat-sub">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
