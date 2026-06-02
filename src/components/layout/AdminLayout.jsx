import {
  BookOpenCheck,
  BookOpenText,
  ChartColumn,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import ToastProvider from '../common/ToastProvider'

const COACHING_NAME = 'IQBAL COACHING'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/classes', label: 'Classes', icon: BookOpenText },
  { to: '/fees', label: 'Fees', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: ChartColumn },
  { to: '/qr', label: 'QR Cards', icon: QrCode },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function AdminLayout({ auth, children }) {
  return (
    <ToastProvider>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">
              <BookOpenCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span className="sidebar-brand-title">{COACHING_NAME}</span>
              <span>Management</span>
            </div>
          </div>

          <div className="sidebar-divider" />

          <nav className="sidebar-nav" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="sidebar-footer">
            <button type="button" className="logout-button danger" onClick={auth.logout}>
              <LogOut size={16} strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="main-panel">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}

export default AdminLayout
