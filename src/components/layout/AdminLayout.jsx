import {
  BookOpenCheck,
  BookOpenText,
  ChartColumn,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  QrCode,
  ScanLine,
  Settings,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { apiRequest } from '../../utils/api'

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
  const [coachingName, setCoachingName] = useState('CoachingOS')

  useEffect(() => {
    let isMounted = true

    apiRequest('/settings', { token: auth.token })
      .then((result) => {
        if (isMounted) setCoachingName(result.coachingName)
      })
      .catch(() => {})

    const handleNameUpdate = (event) => setCoachingName(event.detail)
    window.addEventListener('coaching-name-updated', handleNameUpdate)

    return () => {
      isMounted = false
      window.removeEventListener('coaching-name-updated', handleNameUpdate)
    }
  }, [auth.token])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <BookOpenCheck size={20} strokeWidth={2.2} />
          </div>
          <div>
            <span className="sidebar-brand-title">{coachingName}</span>
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
          <NavLink to="/scan" className="scan-shortcut">
            <ScanLine size={16} strokeWidth={2} />
            <span>Teacher scan</span>
          </NavLink>
          <div className="sidebar-divider" />
          <div className="profile-block">
            <div className="profile-avatar">RA</div>
            <div className="profile-copy">
              <span className="profile-name">Raza Admin</span>
              <span>Administrator</span>
            </div>
            <button type="button" className="logout-button" onClick={auth.logout} aria-label="Logout">
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        {children}
      </main>
    </div>
  )
}

export default AdminLayout
