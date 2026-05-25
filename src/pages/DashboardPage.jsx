import { CreditCard, GraduationCap, Plus, TrendingUp, UserCheck } from 'lucide-react'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import TablePanel from '../components/common/TablePanel'
import { classes, recentActivity } from '../data/mockData'

function DashboardPage() {
  return (
    <div className="page-layout">
      <PageHeader
        title="Dashboard"
        subtitle="Manage school operations, attendance, and fee activity from one place."
        action={(
          <button type="button" className="primary-button">
            <Plus size={16} />
            Add student
          </button>
        )}
      />
      <section className="metric-grid">
        <MetricCard icon={GraduationCap} label="Total students" value="248" tone="brand" />
        <MetricCard icon={UserCheck} label="Today's attendance" value="89%" tone="success" />
        <MetricCard icon={CreditCard} label="Fees collected" value="Rs 184k" tone="info" />
        <MetricCard icon={TrendingUp} label="Pending fees" value="Rs 61k" tone="warning" />
      </section>

      <TablePanel title="Class-wise attendance" subtitle="Today's performance snapshot by class.">
        <div className="stack-list">
          {classes.map((item) => (
            <div key={item.id} className="progress-row">
              <div className="progress-labels">
                <span className="text-emphasis">{item.name}</span>
                <span>{item.attendance}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${item.attendance}%` }} />
              </div>
            </div>
          ))}
        </div>
      </TablePanel>

      <TablePanel title="Recent activity" subtitle="Attendance and fee events from the latest records.">
        <div className="activity-list">
          {recentActivity.map((item) => (
            <div key={`${item.type}-${item.time}`} className="activity-item">
              <div className="activity-badge">{item.type.slice(0, 2).toUpperCase()}</div>
              <div>
                <span className="text-emphasis">{item.text}</span>
                <div className="muted-copy">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </TablePanel>
    </div>
  )
}

export default DashboardPage
