import { useCallback, useEffect, useState } from 'react'
import {
  BookOpenText,
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  Coffee,
  CreditCard,
  GraduationCap,
  Plus,
  ReceiptText,
  ScanLine,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import PanelLoader from '../components/common/PanelLoader'
import useToast from '../components/common/useToast'
import { apiRequest } from '../utils/api'

const emptyDashboard = {
  date: '',
  month: '',
  metrics: {
    totalStudents: 0,
    activeStudents: 0,
    activeClasses: 0,
    attendancePercentage: 0,
    attendancePresent: 0,
    attendanceTotal: 0,
    feesCollected: 0,
    pendingFees: 0,
    paidInstallments: 0,
    pendingInstallments: 0,
  },
  classAttendance: [],
  activities: [],
}

const activityIcons = {
  attendance: ScanLine,
  fee: ReceiptText,
  student: UserPlus,
  'day-off': Coffee,
}

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`
}

function formatMonth(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T00:00:00`))
}

function formatActivityTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  return isToday
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

function DashboardPage({ auth }) {
  const toast = useToast()
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await apiRequest('/dashboard', { token: auth.token })
      setDashboard(result)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [auth.token, setDashboard, setIsLoading, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => loadDashboard(), 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  const { metrics } = dashboard

  return (
    <div className="page-layout dashboard-page">
      <PageHeader
        title="Dashboard"
        subtitle="Today's attendance, current fees, and latest operational activity."
        action={(
          <Link to="/students" className="primary-button">
            <Plus size={16} />
            Add student
          </Link>
        )}
      />

      <section className="metric-grid dashboard-metrics">
        <MetricCard icon={GraduationCap} label="Total students" value={metrics.totalStudents} tone="brand" />
        <MetricCard icon={CalendarCheck} label="Today's attendance" value={`${metrics.attendancePercentage}%`} tone="success" />
        <MetricCard icon={CreditCard} label={`${formatMonth(dashboard.month)} collected`} value={formatMoney(metrics.feesCollected)} tone="info" />
        <MetricCard icon={CircleDollarSign} label="Current fees pending" value={formatMoney(metrics.pendingFees)} tone="warning" />
      </section>

      <section className="dashboard-summary-strip">
        <div>
          <span className="dashboard-summary-icon"><Users size={16} /></span>
          <span><strong>{metrics.activeStudents}</strong> active students</span>
        </div>
        <div>
          <span className="dashboard-summary-icon"><BookOpenText size={16} /></span>
          <span><strong>{metrics.activeClasses}</strong> active classes</span>
        </div>
        <div>
          <span className="dashboard-summary-icon"><CalendarCheck size={16} /></span>
          <span><strong>{metrics.attendancePresent}</strong> of {metrics.attendanceTotal} present</span>
        </div>
        <div>
          <span className="dashboard-summary-icon"><ReceiptText size={16} /></span>
          <span><strong>{metrics.paidInstallments}</strong> paid, {metrics.pendingInstallments} pending</span>
        </div>
      </section>

      <div className="dashboard-workspace">
        <section className="panel-shell dashboard-attendance-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Class attendance</h3>
              <p>Today's active classes and attendance status.</p>
            </div>
            <Link to="/attendance" className="toolbar-button">View attendance</Link>
          </div>
          <div className="panel-content">
            {isLoading ? <PanelLoader label="Loading attendance" /> : (
              <div className="dashboard-class-list">
                {dashboard.classAttendance.length ? dashboard.classAttendance.map((item) => (
                  <div key={item.id} className="dashboard-class-row">
                    <div className="dashboard-class-main">
                      <div>
                        <span className="student-name">{item.name}</span>
                        <span className="dashboard-class-detail">
                          {item.dayOff
                            ? 'Day off'
                            : item.marked
                              ? `${item.present} present / ${item.absent} absent / ${item.leave} leave`
                              : `${item.total} students / Not marked`}
                        </span>
                      </div>
                      <span className={`dashboard-attendance-value${item.dayOff ? ' day-off' : ''}`}>
                        {item.dayOff ? <Coffee size={15} /> : `${item.percentage}%`}
                      </span>
                    </div>
                    <div className="dashboard-progress-track">
                      <span
                        className={item.dayOff ? 'dashboard-progress-fill day-off' : 'dashboard-progress-fill'}
                        style={{ width: item.dayOff ? '100%' : `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                )) : <div className="dashboard-empty">No active classes found.</div>}
              </div>
            )}
          </div>
        </section>

        <section className="panel-shell dashboard-activity-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Recent activity</h3>
              <p>Latest changes across the coaching center.</p>
            </div>
            <Clock3 size={18} />
          </div>
          <div className="panel-content">
            {isLoading ? <PanelLoader label="Loading activity" /> : (
              <div className="dashboard-activity-list">
                {dashboard.activities.length ? dashboard.activities.map((item) => {
                  const Icon = activityIcons[item.type] || Clock3
                  return (
                    <div key={item.id} className={`dashboard-activity-item ${item.type}`}>
                      <span className="dashboard-activity-icon"><Icon size={16} /></span>
                      <div className="dashboard-activity-copy">
                        <span className="student-name">{item.title}</span>
                        <span>{item.detail}</span>
                      </div>
                      <time>{formatActivityTime(item.occurredAt)}</time>
                    </div>
                  )
                }) : <div className="dashboard-empty">No recent activity yet.</div>}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
